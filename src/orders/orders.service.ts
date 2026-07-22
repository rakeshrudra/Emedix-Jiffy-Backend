import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDeliveryAddress } from './entities/order-delivery-address.entity';
import { OrderActor, OrderStatusLog } from './entities/order-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateAdminOrderItemsDto } from './dto/update-admin-order-items.dto';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/entities/product.entity';
import { StoresService } from '../stores/stores.service';
import { CartService } from '../cart/cart.service';
import { AddressesService } from '../addresses/addresses.service';
import { UsersService } from '../users/users.service';

// Swil ERP: invoice hit → PENDING → CONFIRMED
const VALID_ERP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
};

// Order pickup workflow: PENDING → CONFIRMED → READY_FOR_PICKUP → PICKED_UP
const VALID_ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]: OrderStatus.READY_FOR_PICKUP,
  [OrderStatus.READY_FOR_PICKUP]: OrderStatus.PICKED_UP,
};

// Cancellation is a side-exit, not a step in the pickup workflow — allowed
// from any non-terminal state up to (but not including) PICKED_UP. Cash on
// pickup means there is no payment/refund to reverse.
const CANCELLABLE_STATES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.READY_FOR_PICKUP,
];

const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds
const IDEMPOTENCY_PREFIX = 'order:idem:';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusLog)
    private readonly statusLogRepository: Repository<OrderStatusLog>,
    @InjectRepository(OrderDeliveryAddress)
    private readonly orderDeliveryAddressRepository: Repository<OrderDeliveryAddress>,
    private readonly invoicesService: InvoicesService,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) { }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Redis idempotency — fast path
    const redisKey = `${IDEMPOTENCY_PREFIX}${dto.idempotency_key}`;
    const cachedOrderId = await this.redis.get(redisKey);
    if (cachedOrderId) {
      this.logger.warn(
        `Idempotency hit (Redis) for key: ${dto.idempotency_key}`,
      );
      return this.orderRepository.findOne({
        where: { id: Number(cachedOrderId) },
        relations: ['items'],
      });
    }

    // 2. DB unique index — durable backstop for race conditions
    const existing = await this.orderRepository.findOne({
      where: { idempotencyKey: dto.idempotency_key },
    });
    if (existing) {
      this.logger.warn(`Idempotency hit (DB) for key: ${dto.idempotency_key}`);
      this.redis
        .set(redisKey, existing.id, 'EX', IDEMPOTENCY_TTL)
        .catch(() => { });
      return existing;
    }

    // 3. Store must be active and orderable for either now or the selected schedule
    if (dto.scheduled_date || dto.scedule_starttime || dto.schedule_endtime) {
      await this.storesService.assertOrderableAt(
        dto.store_id,
        dto.scheduled_date,
        dto.scedule_starttime,
        dto.schedule_endtime,
      );
    } else {
      await this.storesService.assertOrderable(dto.store_id);
    }

    // 4. Delivery address must belong to the user
    const address = await this.addressesService.findOwnedAddress(
      userId,
      dto.delivery_address_id,
    );

    // 5. Customer must exist
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // 6. Cart is the source of truth for items — must be non-empty
    const cart = await this.cartService.getActiveCart(userId, dto.store_id);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty for this store.');
    }

    // 7. Fetch full product details per cart item — needed to populate
    // order_items with catalog fields the cart doesn't carry (company,
    // type, packaging, composition, HSN).
    const productsByCode = new Map<string, Product>();
    for (const cartItem of cart.items) {
      const product = await this.productsService.findByCode(
        dto.store_id,
        cartItem.productCode,
      );
      if (product) productsByCode.set(cartItem.productCode, product);
    }

    // 8. Compute totals server-side from cart item prices — never trust the client
    const subtotal = cart.items.reduce((sum, item) => {
      const effectivePrice =
        Number(item.productDiscountPrice) || Number(item.productPrice);
      return sum + effectivePrice * item.quantity;
    }, 0);
    const deliveryCharge = 0; // dummy for now — no delivery-fee logic yet
    const discount = 0; // dummy for now — no coupon/discount logic yet
    const totalAmount = subtotal + deliveryCharge - discount;

    const orderNumber = await this.generateOrderNumber();

    // 9. Save order + delivery address snapshot + items + initial status log in one transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrder: Order;

    try {
      const items = cart.items.map((cartItem) => {
        const price = Number(cartItem.productPrice);
        const discountPrice = Number(cartItem.productDiscountPrice);
        const product = productsByCode.get(cartItem.productCode);

        return this.orderItemRepository.create({
          productCode: cartItem.productCode,
          productName: cartItem.productName,
          productCompany: product?.productCompany ?? '',
          productType: product?.productType ?? '',
          packagingOfMedicines: product?.packagingOfMedicines ?? '',
          productComposition: product?.productComposition ?? '',
          hsnCode: product?.hsnCode ?? '',
          qty: cartItem.quantity,
          productPrice: price,
          productDiscountPrice: discountPrice,
          total: (discountPrice || price) * cartItem.quantity,
        });
      });

      const deliveryAddress = this.orderDeliveryAddressRepository.create({
        sourceAddressId: address.id,
        label: address.label,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        formattedAddress: address.formattedAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
      });

      const order = this.orderRepository.create({
        orderNumber,
        userId,
        storeId: dto.store_id,
        status: OrderStatus.PENDING,
        idempotencyKey: dto.idempotency_key,
        subtotal,
        deliveryCharge,
        discount,
        totalAmount,
        scheduledDate: dto.scheduled_date ?? null,
        sceduleStarttime: dto.scedule_starttime ?? null,
        scheduleEndtime: dto.schedule_endtime ?? null,
        deliveryAddress,
        prescriptionUrls: dto.prescription_urls
          ? JSON.stringify(dto.prescription_urls)
          : '',
        items,
      });

      savedOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.manager.save(
        OrderStatusLog,
        this.statusLogRepository.create({
          order: { id: savedOrder.id } as Order,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          actor: OrderActor.SYSTEM,
          notes: 'Order created after payment success',
        }),
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // 6. Cache idempotency key — best-effort, never block the response
    this.redis
      .set(redisKey, savedOrder.id, 'EX', IDEMPOTENCY_TTL)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Redis idempotency cache failed for ${dto.idempotency_key}: ${message}`,
        );
      });

    // 7. Clear only the ordered store cart now that the order is placed - best-effort
    this.cartService
      .clearByUserAndStoreId(userId, dto.store_id)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to clear cart for user ${userId} and store ${dto.store_id} after order: ${message}`,
        );
      });

    return savedOrder;
  }

  async getOrdersByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number; page: number; pages: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async getOrderById(orderId: number, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'statusLogs'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getAdminOrders(
    storeId: string,
    status?: OrderStatus,
    page = 1,
    limit = 30,
  ) {
    const where: Partial<Order> = { storeId };
    if (status) where.status = status;

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['deliveryAddress'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const user = await this.usersService.findById(order.userId);

        return {
          order_id: order.id,
          order_no: order.orderNumber,
          store_id: order.storeId,
          customer_name: user?.name ?? '',
          customer_phone: user?.mobile_no ?? '',
          delivery_address: this.formatAdminDeliveryAddress(
            order.deliveryAddress,
          ),
          subtotal: this.formatMoney(order.subtotal),
          discount: this.formatMoney(order.discount),
          total_amount: this.formatMoney(order.totalAmount),
          scheduled_date: order.scheduledDate,
          scedule_starttime: order.sceduleStarttime,
          schedule_endtime: order.scheduleEndtime,
          created_at: order.createdAt,
          status: order.status,
        };
      }),
    );

    return {
      count: formattedOrders.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      orders: formattedOrders,
    };
  }

  async getAdminOrderItems(orderId: number, storeId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, storeId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const items = [...order.items].sort((a, b) => a.id - b.id);

    return {
      order_id: order.id,
      order_no: order.orderNumber,
      status: order.status,
      items: items.map((item) => ({
        id: item.id,
        product_code: item.productCode,
        product_name: item.productName,
        product_company: item.productCompany,
        product_type: item.productType,
        packaging_of_medicines: item.packagingOfMedicines,
        product_composition: item.productComposition,
        ordered_quantity: item.qty,
        product_price: item.productPrice,
        product_discount_price: item.productDiscountPrice,
        total: item.total,
        hsn_code: item.hsnCode,
        isAvailable: item.isAvailable,
        confirmedQuantity: item.confirmedQuantity,
        created_at: item.createdAt,
      })),
    };
  }

  async updateAdminOrderItems(
    orderId: number,
    storeId: string,
    dto: UpdateAdminOrderItemsDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, storeId },
        relations: ['items'],
      });

      if (!order) throw new NotFoundException('Order not found');

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Order items can only be edited while the order is ${OrderStatus.PENDING}.`,
        );
      }

      const submittedById = new Map(
        dto.items.map((item) => [item.order_item_id, item]),
      );
      const orderItemIds = order.items.map((item) => item.id);

      if (submittedById.size !== order.items.length) {
        throw new BadRequestException(
          'The request must include every item in the order.',
        );
      }

      for (const itemId of orderItemIds) {
        if (!submittedById.has(itemId)) {
          throw new BadRequestException(
            'The request must include every item in the order.',
          );
        }
      }

      for (const submittedId of submittedById.keys()) {
        if (!orderItemIds.includes(submittedId)) {
          throw new BadRequestException(
            'Every submitted order_item_id must belong to the order.',
          );
        }
      }

      for (const item of order.items) {
        const submitted = submittedById.get(item.id);
        const orderedQuantity = Number(item.qty);

        if (submitted.confirmedQuantity > orderedQuantity) {
          throw new BadRequestException(
            `confirmedQuantity cannot exceed ordered quantity for order item ${item.id}.`,
          );
        }

        if (!submitted.isAvailable && submitted.confirmedQuantity !== 0) {
          throw new BadRequestException(
            `confirmedQuantity must be 0 when order item ${item.id} is unavailable.`,
          );
        }

        if (submitted.isAvailable && submitted.confirmedQuantity < 1) {
          throw new BadRequestException(
            `confirmedQuantity must be at least 1 when order item ${item.id} is available.`,
          );
        }

        item.isAvailable = submitted.isAvailable;
        item.confirmedQuantity = submitted.confirmedQuantity;
      }

      const updatedItems = await manager.save(OrderItem, order.items);

      return {
        order_id: order.id,
        items: updatedItems.map((item) => ({
          id: item.id,
          ordered_quantity: item.qty,
          isAvailable: item.isAvailable,
          confirmedQuantity: item.confirmedQuantity,
        })),
      };
    });
  }

  async updateAdminOrderStatus(
    orderId: number,
    storeId: string,
    dto: UpdateAdminOrderStatusDto,
    adminId: string,
  ) {
    const updated = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, storeId },
        relations: ['items'],
      });

      if (!order) throw new NotFoundException('Order not found');

      const targetStatus = dto.status;
      if (order.status === targetStatus) {
        throw new BadRequestException(
          `Order is already in status ${targetStatus}.`,
        );
      }

      const expectedNext = VALID_ADMIN_TRANSITIONS[order.status];
      if (expectedNext !== targetStatus) {
        throw new BadRequestException(
          `Invalid transition: ${order.status} -> ${targetStatus}. Expected: ${expectedNext ?? 'none'}.`,
        );
      }

      if (order.status === OrderStatus.PENDING) {
        this.assertAdminChecklistCanConfirm(order.items);
      }

      const previousStatus = order.status;
      order.status = targetStatus;

      const savedOrder = await manager.save(Order, order);
      await manager.save(
        OrderStatusLog,
        manager.create(OrderStatusLog, {
          order: { id: savedOrder.id } as Order,
          fromStatus: previousStatus,
          toStatus: targetStatus,
          actor: OrderActor.STORE,
          notes: `Updated by admin ${adminId}`,
        }),
      );

      return {
        order: {
          id: savedOrder.id,
          order_no: savedOrder.orderNumber,
          previous_status: previousStatus,
          status: savedOrder.status,
          user_id: savedOrder.userId,
        },
      };
    });

    this.notifyOrderStatusUpdated(
      updated.order.user_id,
      updated.order.status,
      updated.order.order_no,
    );

    return {
      order: {
        id: updated.order.id,
        order_no: updated.order.order_no,
        previous_status: updated.order.previous_status,
        status: updated.order.status,
      },
    };
  }

  /**
   * PATCH /api/orders/:id/cancel (user) and
   * PATCH /api/admin/orders/:orderId/cancel (store).
   * Cancellation is a side-exit from PENDING/CONFIRMED/READY_FOR_PICKUP —
   * not part of the linear pickup workflow, so it bypasses VALID_ADMIN_TRANSITIONS.
   */
  async cancelOrder(
    orderId: number,
    actor: OrderActor.USER | OrderActor.STORE,
    owner: { userId?: string; storeId?: string },
    dto: CancelOrderDto,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: {
          id: orderId,
          ...(owner.userId ? { userId: owner.userId } : {}),
          ...(owner.storeId ? { storeId: owner.storeId } : {}),
        },
      });

      if (!order) throw new NotFoundException('Order not found');

      if (!CANCELLABLE_STATES.includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be cancelled while it is ${order.status}.`,
        );
      }

      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = dto.reason ?? '';

      const savedOrder = await manager.save(Order, order);
      await manager.save(
        OrderStatusLog,
        manager.create(OrderStatusLog, {
          order: { id: savedOrder.id } as Order,
          fromStatus: previousStatus,
          toStatus: OrderStatus.CANCELLED,
          actor,
          notes: dto.reason ?? '',
        }),
      );

      this.logger.log(
        `Order ${savedOrder.orderNumber}: ${previousStatus} → CANCELLED (${actor})`,
      );

      return savedOrder;
    });
  }

  async getOrderInvoice(orderId: number, userId: string): Promise<Invoice> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');

    const invoice = await this.invoicesService.findByOrderNumber(
      order.orderNumber,
    );
    if (!invoice) throw new NotFoundException('Invoice not ready yet');

    return invoice;
  }

  // Called by GET /api/emedix-webhook/orders/pending — returns PENDING orders, no status change
  async fetchPendingOrders(storeId: string): Promise<Order[]> {
    const where: Partial<Order> = { status: OrderStatus.PENDING, storeId };

    const orders = await this.orderRepository.find({
      where,
      relations: ['items', 'deliveryAddress'],
      order: { createdAt: 'ASC' },
    });

    if (orders.length > 0) {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ erpFetchedAt: new Date() })
        .whereInIds(orders.map((o) => o.id))
        .execute();
    }

    return orders;
  }

  async applyErpStatusUpdate(
    orderNumber: string,
    newStatus: string,
    invoiceUrl?: string,
    invoiceNumber?: string,
    notes?: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });
    if (!order) throw new NotFoundException(`Order not found: ${orderNumber}`);

    const targetStatus = newStatus.toUpperCase() as OrderStatus;

    if (targetStatus !== OrderStatus.FAILED) {
      const expectedNext = VALID_ERP_TRANSITIONS[order.status];
      if (expectedNext !== targetStatus) {
        throw new BadRequestException(
          `Invalid transition: ${order.status} → ${targetStatus}. Expected: ${expectedNext ?? 'none'}`,
        );
      }
    }

    const previousStatus = order.status;
    order.status = targetStatus;

    if (invoiceUrl) order.invoiceUrl = invoiceUrl;
    if (invoiceNumber) order.invoiceNumber = invoiceNumber;

    const updated = await this.orderRepository.save(order);
    await this.logTransition(
      order.id,
      previousStatus,
      targetStatus,
      OrderActor.ERP,
      notes,
    );

    this.logger.log(
      `Order ${orderNumber}: ${previousStatus} → ${targetStatus} (ERP webhook)`,
    );
    return updated;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `EJ-${dateStr}-`;

    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let seq = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  private async logTransition(
    orderId: number,
    fromStatus: OrderStatus | null,
    toStatus: OrderStatus,
    actor: OrderActor,
    notes?: string,
  ): Promise<void> {
    const log = this.statusLogRepository.create({
      order: { id: orderId } as Order,
      fromStatus: fromStatus ?? null,
      toStatus,
      actor,
      notes: notes ?? '',
    });
    await this.statusLogRepository.save(log);
  }

  private formatAdminDeliveryAddress(address: OrderDeliveryAddress) {
    return {
      label: address.label,
      address_line_1: address.addressLine1,
      address_line_2: address.addressLine2,
      formatted_address: address.formattedAddress,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      latitude: String(address.latitude),
      longitude: String(address.longitude),
    };
  }

  private formatMoney(value: number | string): string {
    return Number(value).toFixed(2);
  }

  private assertAdminChecklistCanConfirm(items: OrderItem[]): void {
    if (!items.length) {
      throw new BadRequestException('Order cannot be confirmed without items.');
    }

    let availableItemCount = 0;

    for (const item of items) {
      const orderedQuantity = Number(item.qty);
      const confirmedQuantity = Number(item.confirmedQuantity);

      if (confirmedQuantity < 0 || confirmedQuantity > orderedQuantity) {
        throw new BadRequestException(
          `Invalid confirmed quantity for order item ${item.id}.`,
        );
      }

      if (item.isAvailable) {
        if (confirmedQuantity < 1) {
          throw new BadRequestException(
            `Available order item ${item.id} must have a confirmed quantity.`,
          );
        }
        availableItemCount += 1;
      } else if (confirmedQuantity !== 0) {
        throw new BadRequestException(
          `Unavailable order item ${item.id} must have confirmed quantity 0.`,
        );
      }
    }

    if (availableItemCount === 0) {
      throw new BadRequestException(
        'At least one order item must be available before confirming the order.',
      );
    }
  }

  private notifyOrderStatusUpdated(
    userId: string,
    status: OrderStatus,
    orderNumber: string,
  ): void {
    const messages: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.CONFIRMED]: 'Your order has been confirmed by the store.',
      [OrderStatus.READY_FOR_PICKUP]: 'Your order is ready for pickup.',
      [OrderStatus.PICKED_UP]: 'Your order has been marked as picked up.',
    };

    const message = messages[status];
    if (!message) return;

    this.logger.log(
      `Notification deferred for user ${userId}, order ${orderNumber}: ${message}`,
    );
  }
}
