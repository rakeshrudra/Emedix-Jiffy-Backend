import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    Unique,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
@Unique(['invoice', 'product_code'])
export class InvoiceItem {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
    invoice: Invoice;

    @ApiProperty({ example: 'MED10001' })
    @Column({ name: 'product_code' })
    product_code: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Column({ name: 'product_name' })
    product_name: string;

    @ApiProperty({ example: '25.00' })
    @Column({ name: 'product_price' })
    product_price: string;

    @ApiProperty({ example: '22.00' })
    @Column({ name: 'product_discount_price' })
    product_discount_price: string;

    @ApiProperty({ example: '2' })
    @Column()
    qty: string;

    @ApiProperty({ example: '44.00' })
    @Column()
    total: string;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}
