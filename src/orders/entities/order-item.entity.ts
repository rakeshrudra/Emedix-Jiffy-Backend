import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
  @Column()
  productCode: string;

  @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
  @Column()
  productName: string;

  @ApiProperty({ example: 'Cipla Ltd' })
  @Column({ default: '' })
  productCompany: string;

  @ApiProperty({ example: 'Tablet' })
  @Column({ default: '' })
  productType: string;

  @ApiProperty({ example: '10 Tablets per Strip' })
  @Column({ default: '' })
  packagingOfMedicines: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @Column({ default: '' })
  productComposition: string;

  @ApiProperty({ example: 2 })
  @Column()
  qty: number;

  @ApiProperty({ example: false })
  @Column({ name: 'is_available', type: 'boolean', default: false })
  isAvailable: boolean;

  @ApiProperty({ example: 0 })
  @Column({ name: 'confirmed_quantity', type: 'int', default: 0 })
  confirmedQuantity: number;

  @ApiProperty({ example: 25.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  productPrice: number;

  @ApiProperty({ example: 22.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  productDiscountPrice: number;

  @ApiProperty({ example: 44.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({ example: '3004' })
  @Column({ default: '' })
  hsnCode: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
