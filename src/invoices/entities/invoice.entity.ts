import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Unique,
} from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
@Unique(['storeId', 'invoiceNo'])
export class Invoice {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '001' })
    @Column({ name: 'store_id' })
    storeId: string;

    @ApiProperty({ example: 'INV10045' })
    @Column()
    invoiceNo: string;

    @ApiProperty({ example: '2026-02-27' })
    @Column()
    invoiceDate: string;

    @ApiProperty({ example: 'EJ-20260606-0001' })
    @Column()
    orderNo: string;

    @ApiProperty({ example: '12.00' })
    @Column()
    tax: string;

    @ApiProperty({ example: '400.00' })
    @Column()
    subtotal: string;

    @ApiProperty({ example: '452.00' })
    @Column()
    grandTotal: string;

    @ApiProperty({ example: '40.00' })
    @Column({ default: '0.00' })
    shippingCharge: string;

    @ApiProperty({ example: '0.00' })
    @Column({ default: '0.00' })
    walletPrice: string;

    @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
    items: InvoiceItem[];

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
