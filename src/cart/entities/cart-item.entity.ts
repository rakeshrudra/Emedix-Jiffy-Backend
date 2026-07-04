import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @Column({ name: 'product_code' })
  productCode: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_price', type: 'decimal', precision: 10, scale: 2 })
  productPrice: number;

  @Column({ name: 'product_discount_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  productDiscountPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;
}
