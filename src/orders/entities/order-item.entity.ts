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

    @ApiProperty({ example: 'Cipla Ltd', nullable: true })
    @Column({ nullable: true })
    productCompany: string;

    @ApiProperty({ example: 'Tablet', nullable: true })
    @Column({ nullable: true })
    productType: string;

    @ApiProperty({ example: '10 Tablets per Strip', nullable: true })
    @Column({ nullable: true })
    packagingOfMedicines: string;

    @ApiProperty({ example: 'Paracetamol 500mg', nullable: true })
    @Column({ type: 'text', nullable: true })
    productComposition: string;

    @ApiProperty({ example: 2 })
    @Column()
    quantity: number;

    @ApiProperty({ example: '25.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    productPrice: number;

    @ApiProperty({ example: '22.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    productDiscountPrice: number;

    @ApiProperty({ example: '44.00' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @ApiProperty({ example: '3004', nullable: true })
    @Column({ nullable: true })
    hsnCode: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
