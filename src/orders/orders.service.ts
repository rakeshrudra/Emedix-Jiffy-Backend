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
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderActor, OrderStatusLog } from './entities/order-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';

const USER_CANCELLABLE_STATES = [OrderStatus.PENDING];
const ERP_CANCELLABLE_STATES = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

// Swil ERP: invoice hit → PENDING → CONFIRMED
const VALID_ERP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
};

// Admin panel (Phase 2): CONFIRMED → DISPATCHED → DELIVERED

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
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Store)
        private readonly storeRepository: Repository<Store>,
        private readonly dataSource: DataSource,
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
        // 1. Redis idempotency — fast path
        const redisKey = `${IDEMPOTENCY_PREFIX}${dto.idempotency_key}`;
        const cachedOrderId = await this.redis.get(redisKey);
        if (cachedOrderId) {
            this.logger.warn(`Idempotency hit (Redis) for key: ${dto.idempotency_key}`);
            return this.orderRepository.findOne({ where: { id: cachedOrderId }, relations: ['items'] });
        }

        // 2. DB unique index — durable backstop for race conditions
        const existing = await this.orderRepository.findOne({
            where: { idempotencyKey: dto.idempotency_key },
        });
        if (existing) {
            this.logger.warn(`Idempotency hit (DB) for key: ${dto.idempotency_key}`);
            this.redis.set(redisKey, existing.id, 'EX', IDEMPOTENCY_TTL).catch(() => { });
            return existing;
        }

        // 3. Store must be active and open at order creation time
        const store = await this.storeRepository.findOne({ where: { storeId: dto.store_id } });
        if (!store || !store.isActive) {
            throw new BadRequestException('This store is currently unavailable. Please try again later.');
        }
        if (!this.computeIsOpen(store.openingTime, store.closingTime)) {
            throw new BadRequestException(`Store is closed. It opens at ${store.openingTime}.`);
        }

        // 4. Re-validate stock for every item at order time
        const stockErrors: string[] = [];
        for (const item of dto.items) {
            const product = await this.productRepository.findOne({
                where: { productCode: item.product_code, storeId: dto.store_id },
            });
            if (!product || product.status !== 'Enable') {
                stockErrors.push(`"${item.product_name}" is no longer available`);
            } else {
                const stock = parseInt(product.productStock, 10) || 0;
                if (stock <= 0) {
                    stockErrors.push(`"${item.product_name}" is out of stock`);
                } else if (stock < item.qty) {
                    stockErrors.push(`"${item.product_name}" only has ${stock} unit(s) available (requested ${item.qty})`);
                }
            }
        }
        if (stockErrors.length > 0) {
            throw new BadRequestException({ message: 'Some items are unavailable', errors: stockErrors });
        }

        const orderNumber = await this.generateOrderNumber();

        // 5. Save order + items + initial status log in one transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let savedOrder: Order;

        try {
            const items = dto.items.map((i) =>
                this.orderItemRepository.create({
                    productCode: i.product_code,
                    productName: i.product_name,
                    productCompany: i.product_company ?? '',
                    productType: i.product_type ?? '',
                    packagingOfMedicines: i.packaging_of_medicines ?? '',
                    productComposition: i.product_composition ?? '',
                    qty: i.qty,
                    productPrice: i.unit_price,
                    productDiscountPrice: i.discount_price,
                    total: (parseFloat(i.discount_price) * i.qty).toFixed(2),
                    hsnCode: i.hsn_code ?? '',
                }),
            );

            const order = this.orderRepository.create({
                orderNumber,
                userId,
                storeId: dto.store_id,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PAID,
                idempotencyKey: dto.idempotency_key,
                subtotal: dto.subtotal,
                deliveryCharge: dto.delivery_charge,
                discount: dto.discount ?? 0,
                totalAmount: dto.total_amount,
                paymentMethod: dto.payment_method,
                paymentGatewayRef: dto.payment_gateway_ref,
                customerName: dto.customer_name,
                customerPhone: dto.customer_phone,
                deliveryAddress: JSON.stringify(dto.delivery_address),
                prescriptionUrls: dto.prescription_urls ? JSON.stringify(dto.prescription_urls) : '',
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

        // 4. Cache idempotency key — best-effort, never block the response
        this.redis.set(redisKey, savedOrder.id, 'EX', IDEMPOTENCY_TTL).catch((err) => {
            this.logger.warn(`Redis idempotency cache failed for ${dto.idempotency_key}: ${err.message}`);
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

    async getOrderById(orderId: string, userId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
            relations: ['items', 'statusLogs'],
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async getOrderInvoice(orderId: string, userId: string): Promise<Invoice> {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.userId !== userId) throw new ForbiddenException('Access denied');

        const invoice = await this.invoiceRepository.findOne({
            where: { orderNo: order.orderNumber },
            relations: ['items'],
        });
        if (!invoice) throw new NotFoundException('Invoice not ready yet');

        return invoice;
    }

    async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id: orderId, userId } });
        if (!order) throw new NotFoundException('Order not found');

        // Idempotent — already cancelled
        if (order.status === OrderStatus.CANCELLED) return order;

        if (!USER_CANCELLABLE_STATES.includes(order.status)) {
            throw new BadRequestException(
                `Cannot cancel — order is already ${order.status.toLowerCase()} and can no longer be cancelled.`,
            );
        }

        const previousStatus = order.status;
        order.status = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancellationReason = dto.reason ?? 'Cancelled by user';
        order.paymentStatus = PaymentStatus.REFUNDED;

        const updated = await this.orderRepository.save(order);
        await this.logTransition(order.id, previousStatus, OrderStatus.CANCELLED, OrderActor.USER, dto.reason ?? 'Cancelled by user');

        this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}`);
        // TODO: trigger refund via payment gateway (Phase 2)
        return updated;
    }

    // Called by GET /api/emedix-webhook/orders/pending — returns PENDING orders, no status change
    async fetchPendingOrders(storeId: string): Promise<Order[]> {
        const where: Partial<Order> = { status: OrderStatus.PENDING, storeId };

        const orders = await this.orderRepository.find({
            where,
            relations: ['items'],
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
        erpOrderId?: string,
        invoiceUrl?: string,
        invoiceNumber?: string,
        notes?: string,
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { orderNumber } });
        if (!order) throw new NotFoundException(`Order not found: ${orderNumber}`);

        const targetStatus = newStatus.toUpperCase() as OrderStatus;

        // User cancelled while ERP was processing — ignore ERP update, keep cancelled
        if (order.status === OrderStatus.CANCELLED) {
            this.logger.warn(`Order ${orderNumber} already CANCELLED. Ignoring ERP update: ${targetStatus}`);
            return order;
        }

        if (targetStatus === OrderStatus.CANCELLED) {
            if (!ERP_CANCELLABLE_STATES.includes(order.status)) {
                throw new BadRequestException(
                    `ERP cannot cancel order in status: ${order.status}.`,
                );
            }
        } else if (targetStatus !== OrderStatus.FAILED) {
            const expectedNext = VALID_ERP_TRANSITIONS[order.status];
            if (expectedNext !== targetStatus) {
                throw new BadRequestException(
                    `Invalid transition: ${order.status} → ${targetStatus}. Expected: ${expectedNext ?? 'none'}`,
                );
            }
        }

        const previousStatus = order.status;
        order.status = targetStatus;

        if (erpOrderId && !order.erpOrderId) order.erpOrderId = erpOrderId;
        if (invoiceUrl) order.invoiceUrl = invoiceUrl;
        if (invoiceNumber) order.invoiceNumber = invoiceNumber;

        if (targetStatus === OrderStatus.CANCELLED) {
            order.cancelledAt = new Date();
            order.cancellationReason = notes ?? 'Cancelled by ERP';
            order.paymentStatus = PaymentStatus.REFUNDED;
        }

        const updated = await this.orderRepository.save(order);
        await this.logTransition(order.id, previousStatus, targetStatus, OrderActor.ERP, notes);

        this.logger.log(`Order ${orderNumber}: ${previousStatus} → ${targetStatus} (ERP webhook)`);
        // TODO: FCM push notification to user (Phase 2)
        return updated;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private computeIsOpen(openingTime: string | null, closingTime: string | null): boolean {
        if (!openingTime || !closingTime) return true;
        const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const [oh, om] = openingTime.split(':').map(Number);
        const [ch, cm] = closingTime.split(':').map(Number);
        const cur = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
        const open = oh * 60 + om;
        const close = ch * 60 + cm;
        return close > open ? cur >= open && cur < close : cur >= open || cur < close;
    }

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
        orderId: string,
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
}
