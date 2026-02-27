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

    @ApiProperty({ example: 'MED10001' })
    @Column()
    itemNo: string;

    @ApiProperty({ example: '2' })
    @Column()
    qty: string;

    @ApiProperty({ example: '22.00' })
    @Column()
    discountPrice: string;

    @ApiProperty({ example: '25.00' })
    @Column()
    price: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Column()
    itemName: string;

    @ApiProperty({ example: '44.00' })
    @Column()
    total: string;

    @ApiProperty({ example: '0' })
    @Column()
    isReturn: string;

    @ApiProperty({ example: '' })
    @Column()
    returnComment: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
