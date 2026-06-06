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
    @Column({ type: 'text', default: '' })
    productComposition: string;

    @ApiProperty({ example: 2 })
    @Column()
    qty: number;

    @ApiProperty({ example: '25.00' })
    @Column()
    productPrice: string;

    @ApiProperty({ example: '22.00' })
    @Column()
    productDiscountPrice: string;

    @ApiProperty({ example: '44.00' })
    @Column()
    total: string;

    @ApiProperty({ example: '3004' })
    @Column({ default: '' })
    hsnCode: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
