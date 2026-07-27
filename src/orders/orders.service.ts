import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Order, OrderActor, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDeliveryAddress } from './entities/order-delivery-address.entity';
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
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersGateway } from './orders.gateway';

export interface AdminOrderSummary {
  order_id: number;
  order_no: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: {
    label: string;
    address_line_1: string;
    address_line_2: string;
    formatted_address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude: string;
    longitude: string;
  } | null;
  subtotal: string;
  discount: string;
  total_amount: string;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  created_at: Date;
  status: OrderStatus;
}

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
const CANCELLABLE_STATES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.READY_FOR_PICKUP,
];

const RESTORE_STOCK_STATES: OrderStatus[] = [
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
    @InjectRepository(OrderDeliveryAddress)
    private readonly orderDeliveryAddressRepository: Repository<OrderDeliveryAddress>,
    private readonly invoicesService: InvoicesService,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) { }

  async createOrder(user_id: string, dto: CreateOrderDto): Promise<Order> {
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
      where: { idempotency_key: dto.idempotency_key },
    });
    if (existing) {
      this.logger.warn(`Idempotency hit (DB) for key: ${dto.idempotency_key}`);
      this.redis
        .set(redisKey, existing.id, 'EX', IDEMPOTENCY_TTL)
        .catch(() => { });
      return existing;
    }

    // 3. Store must be active and orderable for either now or the selected schedule
    if (dto.scheduled_date || dto.scheduled_start_time || dto.scheduled_end_time) {
      await this.storesService.assertOrderableAt(
        dto.store_id,
        dto.scheduled_date,
        dto.scheduled_start_time,
        dto.scheduled_end_time,
      );
    } else {
      await this.storesService.assertOrderable(dto.store_id);
    }

    // 4. Delivery address must belong to the user
    const address = await this.addressesService.findOwnedAddress(
      user_id,
      dto.delivery_address_id,
    );

    // 5. Customer must exist
    const user = await this.usersService.findById(user_id);
    if (!user) throw new NotFoundException('User not found');

    // 6. Cart is the source of truth for items — must be non-empty
    const cart = await this.cartService.getActiveCart(user_id, dto.store_id);
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
        cartItem.product_code,
      );
      if (product) productsByCode.set(cartItem.product_code, product);
    }

    // 8. Compute totals server-side from cart item prices — never trust the client
    const subtotal = cart.items.reduce((sum, item) => {
      const effectivePrice =
        Number(item.product_discount_price) || Number(item.product_price);
      return sum + effectivePrice * item.quantity;
    }, 0);
    const deliveryCharge = 0; // dummy for now — no delivery-fee logic yet
    const discount = 0; // dummy for now — no coupon/discount logic yet
    const totalAmount = subtotal + deliveryCharge - discount;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrder: Order;

    try {
      const order_number = await this.generateOrderNumber(queryRunner.manager);

      const items = cart.items.map((cartItem) => {
        const price = Number(cartItem.product_price);
        const discountPrice = Number(cartItem.product_discount_price);
        const product = productsByCode.get(cartItem.product_code);

        return this.orderItemRepository.create({
          product_code: cartItem.product_code,
          product_name: cartItem.product_name,
          product_company: product?.product_company ?? '',
          product_type: product?.product_type ?? '',
          packaging_of_medicines: product?.packaging_of_medicines ?? '',
          product_composition: product?.product_composition ?? '',
          hsn_code: product?.hsn_code ?? '',
          qty: cartItem.quantity,
          product_price: price,
          product_discount_price: discountPrice,
          total: (discountPrice || price) * cartItem.quantity,
        });
      });

      const deliveryAddress = this.orderDeliveryAddressRepository.create({
        source_address_id: address.id,
        label: address.label,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        formatted_address: address.formatted_address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
      });

      const order = this.orderRepository.create({
        order_number: order_number,
        user_id: user_id,
        store_id: dto.store_id,
        status: OrderStatus.PENDING,
        idempotency_key: dto.idempotency_key,
        subtotal,
        delivery_charge: deliveryCharge,
        discount,
        total_amount: totalAmount,
        scheduled_date: dto.scheduled_date ?? null,
        scheduled_start_time: dto.scheduled_start_time ?? null,
        scheduled_end_time: dto.scheduled_end_time ?? null,
        delivery_address: deliveryAddress,
        prescription_urls: dto.prescription_urls
          ? JSON.stringify(dto.prescription_urls)
          : '',
        items,
      });

      savedOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // 6. Fire a notification to the customer
    this.notifyOrderStatusUpdated(
      user_id,
      savedOrder.id,
      OrderStatus.PENDING,
      savedOrder.order_number,
    );

    // 7. Push the new order to the store's admin dashboard in real time via web sockets
    this.usersService
      .findById(user_id)
      .then((user) => {
        this.ordersGateway.emitNewOrder(
          savedOrder.store_id,
          this.buildAdminOrderSummary(savedOrder, user),
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to emit order:new for ${savedOrder.order_number}: ${message}`,
        );
      });

    // 8. Cache idempotency key — best-effort, never block the response
    this.redis
      .set(redisKey, savedOrder.id, 'EX', IDEMPOTENCY_TTL)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Redis idempotency cache failed for ${dto.idempotency_key}: ${message}`,
        );
      });

    // 9. Clear only the ordered store cart now that the order is placed - best-effort
    this.cartService
      .clearByUserAndStoreId(user_id, dto.store_id)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to clear cart for user ${user_id} and store ${dto.store_id} after order: ${message}`,
        );
      });

    return savedOrder;
  }

  async getOrdersByUser(
    user_id: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number; page: number; pages: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { user_id: user_id },
      order: { created_at: 'DESC' },
      relations: ['items'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async getOrderById(order_id: number, user_id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: order_id, user_id: user_id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getAdminOrders(
    store_id: string,
    status?: OrderStatus,
    page = 1,
    limit = 30,
  ) {
    const where: Partial<Order> = { store_id: store_id };
    if (status) where.status = status;

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['delivery_address'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const user = await this.usersService.findById(order.user_id);
        return this.buildAdminOrderSummary(order, user);
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

  async getAdminOrderItems(order_id: number, store_id: string) {
    const order = await this.orderRepository.findOne({
      where: { id: order_id, store_id: store_id },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const items = [...order.items].sort((a, b) => a.id - b.id);

    return {
      order_id: order.id,
      order_no: order.order_number,
      status: order.status,
      items: items.map((item) => ({
        id: item.id,
        product_code: item.product_code,
        product_name: item.product_name,
        product_company: item.product_company,
        product_type: item.product_type,
        packaging_of_medicines: item.packaging_of_medicines,
        product_composition: item.product_composition,
        ordered_quantity: item.qty,
        product_price: item.product_price,
        product_discount_price: item.product_discount_price,
        total: item.total,
        hsn_code: item.hsn_code,
        is_available: item.is_available,
        confirmed_quantity: item.confirmed_quantity,
      })),
    };
  }

  async updateAdminOrderItems(
    order_id: number,
    store_id: string,
    dto: UpdateAdminOrderItemsDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: order_id, store_id: store_id },
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

        if (submitted.confirmed_quantity > orderedQuantity) {
          throw new BadRequestException(
            `confirmed_quantity cannot exceed ordered quantity for order item ${item.id}.`,
          );
        }

        if (!submitted.is_available && submitted.confirmed_quantity !== 0) {
          throw new BadRequestException(
            `confirmed_quantity must be 0 when order item ${item.id} is unavailable.`,
          );
        }

        if (submitted.is_available && submitted.confirmed_quantity < 1) {
          throw new BadRequestException(
            `confirmed_quantity must be at least 1 when order item ${item.id} is available.`,
          );
        }

        item.is_available = submitted.is_available;
        item.confirmed_quantity = submitted.confirmed_quantity;
      }

      const updatedItems = await manager.save(OrderItem, order.items);

      return {
        order_id: order.id,
        items: updatedItems.map((item) => ({
          id: item.id,
          ordered_quantity: item.qty,
          is_available: item.is_available,
          confirmed_quantity: item.confirmed_quantity,
        })),
      };
    });
  }

  async updateAdminOrderStatus(
    order_id: number,
    store_id: string,
    dto: UpdateAdminOrderStatusDto,
    admin_id: string,
  ) {
    const updated = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: order_id, store_id: store_id },
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

      if (previousStatus === OrderStatus.PENDING && targetStatus === OrderStatus.CONFIRMED) {
        await this.reduceProductStock(manager, store_id, order.items);
      }

      return {
        order: {
          id: savedOrder.id,
          order_no: savedOrder.order_number,
          previous_status: previousStatus,
          status: savedOrder.status,
          user_id: savedOrder.user_id,
        },
      };
    });

    this.notifyOrderStatusUpdated(
      updated.order.user_id,
      updated.order.id,
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

  async cancelOrder(
    order_id: number,
    actor: OrderActor.USER | OrderActor.STORE,
    owner: { user_id?: string; store_id?: string },
    dto: CancelOrderDto,
  ): Promise<Order> {
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: {
          id: order_id,
          ...(owner.user_id ? { user_id: owner.user_id } : {}),
          ...(owner.store_id ? { store_id: owner.store_id } : {}),
        },
        relations: ['items'],
      });

      if (!order) throw new NotFoundException('Order not found');

      if (!CANCELLABLE_STATES.includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be cancelled while it is ${order.status}.`,
        );
      }

      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.cancelled_at = new Date();
      order.cancellation_reason = dto.reason ?? '';
      order.cancelled_by = actor === OrderActor.USER ? 'USER' : 'STORE';

      const savedOrder = await manager.save(Order, order);

      if (RESTORE_STOCK_STATES.includes(previousStatus)) {
        await this.restoreProductStock(manager, savedOrder.store_id, order.items);
      }

      this.logger.log(
        `Order ${savedOrder.order_number}: ${previousStatus} → CANCELLED (${actor})`,
      );

      return savedOrder;
    });

    this.notifyOrderStatusUpdated(
      savedOrder.user_id,
      savedOrder.id,
      OrderStatus.CANCELLED,
      savedOrder.order_number,
    );

    return savedOrder;
  }

  async getOrderInvoice(order_id: number, user_id: string): Promise<Invoice> {
    const order = await this.orderRepository.findOne({
      where: { id: order_id },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.user_id !== user_id) throw new ForbiddenException('Access denied');

    const invoice = await this.invoicesService.findByOrderNumber(
      order.order_number,
    );
    if (!invoice) throw new NotFoundException('Invoice not ready yet');

    return invoice;
  }

  async fetchPendingOrders(store_id: string): Promise<Order[]> {
    const where: Partial<Order> = { status: OrderStatus.PENDING, store_id: store_id };

    const orders = await this.orderRepository.find({
      where,
      relations: ['items', 'delivery_address'],
      order: { created_at: 'ASC' },
    });

    if (orders.length > 0) {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ erp_fetched_at: new Date() })
        .whereInIds(orders.map((o) => o.id))
        .execute();
    }

    return orders;
  }

  async applyErpStatusUpdate(
    order_number: string,
    new_status: string,
    invoice_url?: string,
    invoice_number?: string,
    notes?: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_number: order_number },
    });
    if (!order) throw new NotFoundException(`Order not found: ${order_number}`);

    const targetStatus = new_status.toUpperCase() as OrderStatus;

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

    if (invoice_url) order.invoice_url = invoice_url;
    if (invoice_number) order.invoice_number = invoice_number;

    const updated = await this.orderRepository.save(order);
    this.logger.log(
      `Order ${order_number}: ${previousStatus} → ${targetStatus} (ERP webhook)${notes ? ` — ${notes}` : ''}`,
    );
    return updated;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async reduceProductStock(
    manager: EntityManager,
    store_id: string,
    items: OrderItem[],
  ): Promise<void> {
    for (const item of items) {
      const quantity = Number(item.confirmed_quantity) || 0;
      if (quantity <= 0) continue;

      await manager
        .createQueryBuilder()
        .update(Product)
        .set({
          product_stock: () => 'GREATEST(product_stock - :quantity, 0)',
        })
        .where('store_id = :store_id', { store_id })
        .andWhere('product_code = :product_code', { product_code: item.product_code })
        .setParameters({ quantity })
        .execute();
    }
  }

  private async restoreProductStock(
    manager: EntityManager,
    store_id: string,
    items: OrderItem[],
  ): Promise<void> {
    for (const item of items) {
      const quantity = Number(item.confirmed_quantity) || 0;
      if (quantity <= 0) continue;

      await manager
        .createQueryBuilder()
        .update(Product)
        .set({
          product_stock: () => 'product_stock + :quantity',
        })
        .where('store_id = :store_id', { store_id })
        .andWhere('product_code = :product_code', { product_code: item.product_code })
        .setParameters({ quantity })
        .execute();
    }
  }

  private async generateOrderNumber(manager: EntityManager): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `EJ-${dateStr}-`;

    const lastOrder = await manager
      .createQueryBuilder(Order, 'order')
      .where('order.order_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.order_number', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let seq = 1;
    if (lastOrder) {
      const parts = lastOrder.order_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  private formatAdminDeliveryAddress(address: OrderDeliveryAddress) {
    return {
      label: address.label,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      formatted_address: address.formatted_address,
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

  private buildAdminOrderSummary(
    order: Order,
    user: { name: string; mobile_no: string } | null,
  ): AdminOrderSummary {
    return {
      order_id: order.id,
      order_no: order.order_number,
      store_id: order.store_id,
      customer_name: user?.name ?? '',
      customer_phone: user?.mobile_no ?? '',
      delivery_address: order.delivery_address
        ? this.formatAdminDeliveryAddress(order.delivery_address)
        : null,
      subtotal: this.formatMoney(order.subtotal),
      discount: this.formatMoney(order.discount),
      total_amount: this.formatMoney(order.total_amount),
      scheduled_date: order.scheduled_date,
      scheduled_start_time: order.scheduled_start_time,
      scheduled_end_time: order.scheduled_end_time,
      created_at: order.created_at,
      status: order.status,
    };
  }

  private assertAdminChecklistCanConfirm(items: OrderItem[]): void {
    if (!items.length) {
      throw new BadRequestException('Order cannot be confirmed without items.');
    }

    let availableItemCount = 0;

    for (const item of items) {
      const orderedQuantity = Number(item.qty);
      const confirmedQuantity = Number(item.confirmed_quantity);

      if (confirmedQuantity < 0 || confirmedQuantity > orderedQuantity) {
        throw new BadRequestException(
          `Invalid confirmed quantity for order item ${item.id}.`,
        );
      }

      if (item.is_available) {
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
    user_id: string,
    order_id: number,
    status: OrderStatus,
    order_number: string,
  ): void {
    const messages: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'Your order has been placed successfully.',
      [OrderStatus.CONFIRMED]: 'Your order has been confirmed by the store.',
      [OrderStatus.READY_FOR_PICKUP]: 'Your order is ready for pickup.',
      [OrderStatus.PICKED_UP]: 'Your order has been marked as picked up.',
      [OrderStatus.CANCELLED]: 'Your order has been cancelled.',
    };

    const message = messages[status];
    if (!message) return;

    // Best-effort, fire-and-forget — must never affect the status-update response.
    this.notificationsService
      .sendOrderStatusUpdate(user_id, `Order ${order_number}`, message, {
        order_id: order_id,
        order_number: order_number,
        status,
      })
      .catch((err) => {
        const message2 = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Push notification failed for user ${user_id}, order ${order_number}: ${message2}`,
        );
      });
  }
}
