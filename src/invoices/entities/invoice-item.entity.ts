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
@Unique(['invoice', 'productCode'])
export class InvoiceItem {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
    invoice: Invoice;

    @ApiProperty({ example: 'MED10001' })
    @Column()
    productCode: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Column()
    productName: string;

    @ApiProperty({ example: '25.00' })
    @Column()
    productPrice: string;

    @ApiProperty({ example: '22.00' })
    @Column()
    productDiscountPrice: string;

    @ApiProperty({ example: '2' })
    @Column()
    qty: string;

    @ApiProperty({ example: '44.00' })
    @Column()
    total: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
