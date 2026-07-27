import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('order_deliveries')
@Index('UQ_order_deliveries_order_id', ['order_id'], { unique: true })
export class OrderDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  order_id: number;

  @OneToOne(() => Order, (order) => order.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'delivery_partner_name', length: 255 })
  delivery_partner_name: string;

  @Column({ name: 'delivery_partner_phone', length: 255 })
  delivery_partner_phone: string;

  @Column({ name: 'estimated_delivery_time', type: 'datetime', nullable: true })
  estimated_delivery_time: Date;

  @Column({ name: 'dispatched_at', type: 'datetime' })
  dispatched_at: Date;

  @Column({ name: 'delivered_at', type: 'datetime', nullable: true })
  delivered_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
