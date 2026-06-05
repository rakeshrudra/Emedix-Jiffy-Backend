import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PACKED = 'PACKED',
    DISPATCHED = 'DISPATCHED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

@Entity('orders')
export class Order {
    @ApiProperty({ example: 'uuid-v4' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'EJ-20260530-0001' })
    @Index({ unique: true })
    @Column()
    orderNumber: string;

    @ApiProperty({ example: 'uuid-of-user' })
    @Index()
    @Column()
    userId: string;

    @ApiProperty({ example: '001' })
    @Column()
    storeId: string;

    @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @ApiProperty({ example: 'SW-12345', nullable: true })
    @Column({ nullable: true })
    erpOrderId: string;

    // Client-generated UUID to prevent duplicate order creation on retry
    @Index({ unique: true })
    @Column()
    idempotencyKey: string;

    @ApiProperty({ example: '490.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @ApiProperty({ example: '40.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deliveryCharge: number;

    @ApiProperty({ example: '0.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @ApiProperty({ example: '530.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @ApiProperty({ example: 'UPI' })
    @Column()
    paymentMethod: string;

    @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @ApiProperty({ example: 'PAY123456', nullable: true })
    @Column({ nullable: true })
    paymentGatewayRef: string;

    @Column({ type: 'text' })
    deliveryAddress: string;

    @ApiProperty({ example: 'Rahul Sharma' })
    @Column()
    customerName: string;

    @ApiProperty({ example: '9876543210' })
    @Column()
    customerPhone: string;

    @Column({ type: 'text', nullable: true })
    prescriptionUrls: string;

    @Column({ default: 0 })
    erpPushAttempts: number;

    @Column({ type: 'datetime', nullable: true })
    erpPushedAt: Date;

    @ApiProperty({ nullable: true })
    @Column({ nullable: true })
    invoiceUrl: string;

    @ApiProperty({ nullable: true })
    @Column({ nullable: true })
    invoiceNumber: string;

    @Column({ type: 'datetime', nullable: true })
    cancelledAt: Date;

    @Column({ type: 'text', nullable: true })
    cancellationReason: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @OneToMany(() => OrderStatusLog, (log) => log.order, { cascade: true })
    statusLogs: OrderStatusLog[];

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
