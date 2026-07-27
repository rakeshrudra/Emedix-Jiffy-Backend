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
@Unique(['store_id', 'invoice_no'])
export class Invoice {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '001' })
    @Column({ name: 'store_id' })
    store_id: string;

    @ApiProperty({ example: 'INV10045' })
    @Column({ name: 'invoice_no' })
    invoice_no: string;

    @ApiProperty({ example: '2026-02-27' })
    @Column({ name: 'invoice_date' })
    invoice_date: string;

    @ApiProperty({ example: 'EJ-20260606-0001' })
    @Column({ name: 'order_no' })
    order_no: string;

    @ApiProperty({ example: '12.00' })
    @Column()
    tax: string;

    @ApiProperty({ example: '400.00' })
    @Column()
    subtotal: string;

    @ApiProperty({ example: '452.00' })
    @Column({ name: 'grand_total' })
    grand_total: string;

    @ApiProperty({ example: '40.00' })
    @Column({ name: 'shipping_charge', default: '0.00' })
    shipping_charge: string;

    @ApiProperty({ example: '0.00' })
    @Column({ name: 'wallet_price', default: '0.00' })
    wallet_price: string;

    @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
    items: InvoiceItem[];

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
