import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('product_stocks')
@Unique(['storeId', 'productId'])
export class ProductStock {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'STORE-001' })
  @Column()
  storeId: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @Column()
  nameToDisplay: string;

  @ApiProperty({ example: 'PROD-1234' })
  @Column()
  productId: string;

  @ApiProperty({ example: '3004' })
  @Column({ nullable: true })
  hsnSac: string;

  @ApiProperty({ example: 150.0 })
  @Column('decimal', { precision: 12, scale: 2 })
  stock: number;

  @ApiProperty({ example: 'Strips' })
  @Column({ nullable: true })
  stockUnit: string;

  @ApiProperty({ example: 7500.0 })
  @Column('decimal', { precision: 12, scale: 2 })
  stockValue: number;

  @ApiProperty({ example: 'Tablets' })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({ example: 'OTC' })
  @Column({ nullable: true })
  marketingGroup: string;

  @ApiProperty({ example: 'Sun Pharma' })
  @Column({ nullable: true })
  manufacturingCo: string;

  @ApiProperty({ example: 50.0 })
  @Column('decimal', { precision: 10, scale: 2 })
  mrp: number;

  @ApiProperty({ example: 45.0 })
  @Column('decimal', { precision: 10, scale: 2 })
  rate: number;

  @ApiProperty({ example: 'Active' })
  @Column({ nullable: true })
  status: string;

  @ApiProperty({ example: 'H' })
  @Column({ nullable: true })
  schedule: string;

  @ApiProperty({ example: '2026-02-25' })
  @Column({ nullable: true })
  lastUpdate: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
