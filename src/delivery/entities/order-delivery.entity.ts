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
@Index('UQ_order_deliveries_order_id', ['orderId'], { unique: true })
export class OrderDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: number;

  @OneToOne(() => Order, (order) => order.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'delivery_partner_name', length: 255 })
  deliveryPartnerName: string;

  @Column({ name: 'delivery_partner_phone', length: 255 })
  deliveryPartnerPhone: string;

  @Column({ name: 'estimated_delivery_time', type: 'datetime', nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ name: 'dispatched_at', type: 'datetime' })
  dispatchedAt: Date;

  @Column({ name: 'delivered_at', type: 'datetime', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
