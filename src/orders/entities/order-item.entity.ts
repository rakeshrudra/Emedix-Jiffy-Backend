import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ApiProperty({ example: 'MED10001' })
  @Column({ name: 'product_code' })
  product_code: string;

  @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
  @Column({ name: 'product_name' })
  product_name: string;

  @ApiProperty({ example: 'Cipla Ltd' })
  @Column({ name: 'product_company', default: '' })
  product_company: string;

  @ApiProperty({ example: 'Tablet' })
  @Column({ name: 'product_type', default: '' })
  product_type: string;

  @ApiProperty({ example: '10 Tablets per Strip' })
  @Column({ name: 'packaging_of_medicines', default: '' })
  packaging_of_medicines: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @Column({ name: 'product_composition', default: '' })
  product_composition: string;

  @ApiProperty({ example: 2 })
  @Column()
  qty: number;

  @ApiProperty({ example: false })
  @Column({ name: 'is_available', type: 'boolean', default: false })
  is_available: boolean;

  @ApiProperty({ example: 0 })
  @Column({ name: 'confirmed_quantity', type: 'int', default: 0 })
  confirmed_quantity: number;

  @ApiProperty({ example: 25.0 })
  @Column({ name: 'product_price', type: 'decimal', precision: 10, scale: 2 })
  product_price: number;

  @ApiProperty({ example: 22.0 })
  @Column({
    name: 'product_discount_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  product_discount_price: number;

  @ApiProperty({ example: 44.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({ example: '3004' })
  @Column({ name: 'hsn_code', default: '' })
  hsn_code: string;
}
