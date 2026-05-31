import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderActor, OrderStatusLog } from './entities/order-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { SwilErpService, SwilOrderPayload } from './swil-erp.service';

// States that can transition to CANCELLED
const CANCELLABLE_STATES = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

// Valid inbound status transitions from ERP
const VALID_ERP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.PACKED,
    [OrderStatus.PACKED]: OrderStatus.DISPATCHED,
    [OrderStatus.DISPATCHED]: OrderStatus.DELIVERED,
};

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
        private readonly swilErpService: SwilErpService,
    ) {}

    async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
        // 1. Idempotency: return existing order if same key already processed
        const existing = await this.orderRepository.findOne({
            where: { idempotencyKey: dto.idempotency_key },
        });
        if (existing) {
            this.logger.warn(`Duplicate order creation attempt for key: ${dto.idempotency_key}`);
            return existing;
        }

        // 2. Generate order number (EJ-YYYYMMDD-XXXX)
        const orderNumber = await this.generateOrderNumber();

        // 3. Build order items — snapshot of product details at time of order
        const items = dto.items.map((i) =>
            this.orderItemRepository.create({
                productCode: i.product_code,
                productName: i.product_name,
                productCompany: i.product_company ?? null,
                productType: i.product_type ?? null,
                packagingOfMedicines: i.packaging_of_medicines ?? null,
                productComposition: i.product_composition ?? null,
                quantity: i.qty,
                productPrice: i.unit_price,
                productDiscountPrice: i.discount_price,
                total: Number((i.discount_price * i.qty).toFixed(2)),
                hsnCode: i.hsn_code ?? null,
            }),
        );

        // 4. Persist order with PENDING status
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
            prescriptionUrls: dto.prescription_urls
                ? JSON.stringify(dto.prescription_urls)
                : null,
            items,
        });

        const savedOrder = await this.orderRepository.save(order);

        // 5. Log initial PENDING transition
        await this.logTransition(savedOrder.id, null, OrderStatus.PENDING, OrderActor.SYSTEM, 'Order created after payment success');

        // 6. Push to Swil ERP asynchronously (non-blocking — retries internally)
        this.pushToErpWithRetry(savedOrder, dto).catch(() => {
            // Errors are logged inside the method; never surface to the user
        });

        return savedOrder;
    }

    async getOrdersByUser(userId: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            relations: ['items'],
        });
    }

    async getOrderById(orderId: string, userId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
            relations: ['items', 'statusLogs'],
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        if (!CANCELLABLE_STATES.includes(order.status)) {
            throw new BadRequestException(
                `Order cannot be cancelled in ${order.status} state. Contact store if already packed.`,
            );
        }

        const previousStatus = order.status;
        order.status = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancellationReason = dto.reason ?? 'Cancelled by user';
        order.paymentStatus = PaymentStatus.REFUNDED;

        const updated = await this.orderRepository.save(order);
        await this.logTransition(
            order.id,
            previousStatus,
            OrderStatus.CANCELLED,
            OrderActor.USER,
            dto.reason ?? 'Cancelled by user',
        );

        this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}`);
        // TODO: Trigger refund via payment gateway and notify ERP
        return updated;
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
        if (!order) {
            throw new NotFoundException(`Order not found: ${orderNumber}`);
        }

        const targetStatus = newStatus.toUpperCase() as OrderStatus;

        // Allow CANCELLED and FAILED from any state; otherwise validate transition
        if (targetStatus !== OrderStatus.CANCELLED && targetStatus !== OrderStatus.FAILED) {
            const expectedNext = VALID_ERP_TRANSITIONS[order.status];
            if (expectedNext !== targetStatus) {
                throw new BadRequestException(
                    `Invalid transition: ${order.status} → ${targetStatus}. Expected next: ${expectedNext ?? 'none'}`,
                );
            }
        }

        const previousStatus = order.status;
        order.status = targetStatus;

        if (erpOrderId && !order.erpOrderId) {
            order.erpOrderId = erpOrderId;
        }
        if (invoiceUrl) {
            order.invoiceUrl = invoiceUrl;
        }
        if (invoiceNumber) {
            order.invoiceNumber = invoiceNumber;
        }
        if (targetStatus === OrderStatus.CANCELLED) {
            order.cancelledAt = new Date();
            order.cancellationReason = notes ?? 'Cancelled by ERP';
            order.paymentStatus = PaymentStatus.REFUNDED;
        }

        const updated = await this.orderRepository.save(order);
        await this.logTransition(order.id, previousStatus, targetStatus, OrderActor.ERP, notes);

        this.logger.log(`Order ${orderNumber}: ${previousStatus} → ${targetStatus} (via ERP webhook)`);
        // TODO: Send FCM push notification to user for each status change
        return updated;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private async generateOrderNumber(): Promise<string> {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
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

    private async pushToErpWithRetry(order: Order, dto: CreateOrderDto): Promise<void> {
        const delays = [2000, 4000, 8000]; // exponential backoff: 2s, 4s, 8s
        const payload = this.buildErpPayload(order, dto);

        for (let attempt = 0; attempt <= delays.length; attempt++) {
            try {
                if (attempt > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]));
                }

                const result = await this.swilErpService.pushOrder(payload);

                await this.orderRepository.update(order.id, {
                    erpOrderId: result.erp_order_id,
                    status: OrderStatus.CONFIRMED,
                    erpPushAttempts: attempt + 1,
                    erpPushedAt: new Date(),
                });

                await this.logTransition(
                    order.id,
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,
                    OrderActor.ERP,
                    `ERP acknowledged. erp_order_id: ${result.erp_order_id}`,
                );

                this.logger.log(
                    `Order ${order.orderNumber} pushed to ERP on attempt ${attempt + 1}. ERP ID: ${result.erp_order_id}`,
                );
                return;
            } catch (error) {
                this.logger.warn(
                    `ERP push attempt ${attempt + 1}/${delays.length + 1} failed for ${order.orderNumber}: ${error.message}`,
                );
            }
        }

        // All retries exhausted — keep PENDING, alert via logs
        await this.orderRepository.update(order.id, { erpPushAttempts: delays.length + 1 });
        this.logger.error(
            `ALERT: All ERP push attempts failed for order ${order.orderNumber}. Manual reconciliation required.`,
        );
    }

    private buildErpPayload(order: Order, dto: CreateOrderDto): SwilOrderPayload {
        const addr = dto.delivery_address;
        const deliveryAddressStr = `${addr.formatted_address}, ${addr.city}, ${addr.state} - ${addr.pincode}`;

        return {
            order_no: order.orderNumber,
            store_id: order.storeId,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            delivery_address: deliveryAddressStr,
            payment_method: order.paymentMethod,
            payment_gateway_ref: order.paymentGatewayRef,
            subtotal: order.subtotal.toString(),
            delivery_charge: order.deliveryCharge.toString(),
            discount: order.discount.toString(),
            total_amount: order.totalAmount.toString(),
            items: dto.items.map((i) => ({
                product_code: i.product_code,
                product_name: i.product_name,
                qty: i.qty,
                unit_price: i.unit_price.toString(),
                discount_price: i.discount_price.toString(),
                total: (i.discount_price * i.qty).toFixed(2),
                hsn_code: i.hsn_code ?? undefined,
            })),
        };
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
            notes: notes ?? null,
        });
        await this.statusLogRepository.save(log);
    }
}
