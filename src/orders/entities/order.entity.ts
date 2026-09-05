import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderDelivery } from '../../delivery/entities/order-delivery.entity';
import { OrderDeliveryAddress } from './order-delivery-address.entity';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum OrderActor {
  USER = 'USER',
  ERP = 'ERP',
  SYSTEM = 'SYSTEM',
  STORE = 'STORE',
}

export enum FulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'EJ-20260530-0001' })
  @Index({ unique: true })
  @Column({ name: 'order_number' })
  order_number: string;

  @ApiProperty({ example: '001' })
  @Column({ name: 'store_id' })
  store_id: string;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'store_id' })
  store: Store;

  @ApiProperty({ example: 'uuid-of-user' })
  @Index()
  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ enum: FulfillmentType, example: FulfillmentType.PICKUP })
  @Column({
    name: 'fulfillment_type',
    type: 'enum',
    enum: FulfillmentType,
    default: FulfillmentType.PICKUP,
  })
  fulfillment_type: FulfillmentType;

  // Client-generated UUID to prevent duplicate order creation on retry
  @Index({ unique: true })
  @Column({ name: 'idempotency_key' })
  idempotency_key: string;

  @ApiProperty({ example: '490.00' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty({ example: '40.00' })
  @Column({ name: 'delivery_charge', type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_charge: number;

  @ApiProperty({ example: '0.00' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({ example: '530.00' })
  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @ApiProperty({ example: 'John Doe' })
  @Column({ name: 'recipient_name' })
  recipient_name: string;

  @ApiProperty({ example: '9876543210' })
  @Column({ name: 'recipient_mobile_number', type: 'varchar', length: 10 })
  recipient_mobile_number: string;

  @OneToOne(() => OrderDeliveryAddress, (address) => address.order, {
    cascade: true,
    eager: true,
  })
  delivery_address: OrderDeliveryAddress | null;

  @Column({ name: 'prescription_urls', type: 'text', default: '' })
  prescription_urls: string;

  @ApiProperty({ example: '2026-07-24', required: false })
  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduled_date: string | null;

  @ApiProperty({ example: '11:00:00', required: false })
  @Column({ name: 'scheduled_start_time', type: 'time', nullable: true })
  scheduled_start_time: string | null;

  @ApiProperty({ example: '12:00:00', required: false })
  @Column({ name: 'scheduled_end_time', type: 'time', nullable: true })
  scheduled_end_time: string | null;

  // Set when Swil ERP first fetches this order
  @Column({ name: 'erp_fetched_at', type: 'datetime', nullable: true })
  erp_fetched_at: Date;

  @ApiProperty({ example: 'https://cdn.example.com/invoice.pdf' })
  @Column({ name: 'invoice_url', default: '' })
  invoice_url: string;

  @ApiProperty({ example: 'INV10045' })
  @Column({ name: 'invoice_number', default: '' })
  invoice_number: string;

  @ApiProperty({ enum: ['USER', 'STORE'], required: false })
  @Column({ name: 'cancelled_by', type: 'enum', enum: ['USER', 'STORE'], nullable: true })
  cancelled_by: 'USER' | 'STORE' | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelled_at: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellation_reason: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @OneToOne(() => OrderDelivery, (orderDelivery) => orderDelivery.order)
  delivery?: OrderDelivery | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
