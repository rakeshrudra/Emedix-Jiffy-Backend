import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'cart_id', nullable: true })
  cart_id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'product_code' })
  product_code: string;

  @Column({ name: 'product_name' })
  product_name: string;

  @Column({ name: 'product_price', type: 'decimal', precision: 10, scale: 2 })
  product_price: number;

  @Column({ name: 'product_discount_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  product_discount_price: number;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
