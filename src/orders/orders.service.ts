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

    // 3. Store must be active and open at order creation time
    await this.storesService.assertOrderable(dto.store_id);

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
        this.logger.warn(
          `Redis idempotency cache failed for ${dto.idempotency_key}: ${err.message}`,
        );
      });

    // 7. Clear only the ordered store cart now that the order is placed - best-effort
    this.cartService
      .clearByUserAndStoreId(userId, dto.store_id)
      .catch((err) => {
        this.logger.warn(
          `Failed to clear cart for user ${userId} and store ${dto.store_id} after order: ${err.message}`,
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

  async getAdminOrdersByStore(storeId: string) {
    const orders = await this.orderRepository.find({
      where: { storeId, status: OrderStatus.PENDING },
      relations: ['items', 'deliveryAddress'],
      order: { createdAt: 'DESC' },
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const user = await this.usersService.findById(order.userId);

        return {
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
          created_at: order.createdAt,
          status: order.status,
        };
      }),
    );

    return {
      count: formattedOrders.length,
      orders: formattedOrders,
    };
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

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(
        `Order ${orderNumber} already CANCELLED. Ignoring ERP update: ${targetStatus}`,
      );
      return order;
    }

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
}
