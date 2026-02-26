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
@Unique(['invoice', 'itemNo'])
export class InvoiceItem {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
    invoice: Invoice;

    @ApiProperty({ example: '10000008' })
    @Column()
    itemNo: string;

    @ApiProperty({ example: '5.00' })
    @Column()
    qty: string;

    @ApiProperty({ example: '250.00' })
    @Column()
    discountPrice: string;

    @ApiProperty({ example: '100.00' })
    @Column()
    price: string;

    @ApiProperty({ example: '2 MUCH GOLD 6 CAP' })
    @Column()
    itemName: string;

    @ApiProperty({ example: '1250.00' })
    @Column()
    total: string;

    @ApiProperty({ example: '0' })
    @Column({ default: '0' })
    isReturn: string;

    @ApiProperty({ example: '' })
    @Column({ type: 'text', nullable: true })
    returnComment: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
