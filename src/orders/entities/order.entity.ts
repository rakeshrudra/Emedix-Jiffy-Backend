import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { OrderDelivery } from '../../delivery/entities/order-delivery.entity';
import { OrderDeliveryAddress } from './order-delivery-address.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'EJ-20260530-0001' })
  @Index({ unique: true })
  @Column()
  orderNumber: string;

  @ApiProperty({ example: '001' })
  @Column({ name: 'store_id' })
  storeId: string;

  @ApiProperty({ example: 'uuid-of-user' })
  @Index()
  @Column()
  userId: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

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

  @OneToOne(() => OrderDeliveryAddress, (address) => address.order, {
    cascade: true,
    eager: true,
  })
  deliveryAddress: OrderDeliveryAddress;

  @Column({ type: 'text', default: '' })
  prescriptionUrls: string;

  // Set when Swil ERP first fetches this order
  @Column({ type: 'datetime', nullable: true })
  erpFetchedAt: Date;

  @ApiProperty({ example: 'https://cdn.example.com/invoice.pdf' })
  @Column({ default: '' })
  invoiceUrl: string;

  @ApiProperty({ example: 'INV10045' })
  @Column({ default: '' })
  invoiceNumber: string;

  // Set only when order is cancelled
  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', default: '' })
  cancellationReason: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order, { cascade: true })
  statusLogs: OrderStatusLog[];

  @OneToOne(() => OrderDelivery, (orderDelivery) => orderDelivery.order)
  delivery?: OrderDelivery | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
