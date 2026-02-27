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
    @Column()
    storeId: string;

    @ApiProperty({ example: 'INV10045' })
    @Column()
    invoiceNo: string;

    @ApiProperty({ example: '2026-02-27' })
    @Column()
    invoiceDate: string;

    @ApiProperty({ example: 'ORD10045' })
    @Column()
    orderNo: string;

    @ApiProperty({ example: 'Shipped' })
    @Column()
    orderStatus: string;

    @ApiProperty({ example: 'Rahul Sharma' })
    @Column()
    customerName: string;

    @ApiProperty({ example: 'MG Road, Andheri East' })
    @Column({ type: 'text' })
    address1: string;

    @ApiProperty({ example: 'Mumbai' })
    @Column()
    customerCity: string;

    @ApiProperty({ example: 'India' })
    @Column()
    customerCountry: string;

    @ApiProperty({ example: '400069' })
    @Column()
    customerZipcode: string;

    @ApiProperty({ example: 'Online' })
    @Column()
    paymentMethod: string;

    @ApiProperty({ example: '9876543210' })
    @Column()
    phoneNo: string;

    @ApiProperty({ example: 'UPI' })
    @Column()
    paymentType: string;

    @ApiProperty({ example: '' })
    @Column()
    couponCode: string;

    @ApiProperty({ example: '0.00' })
    @Column()
    couponDiscount: string;

    @ApiProperty({ example: '0.00' })
    @Column()
    couponPrice: string;

    @ApiProperty({ example: '0.00' })
    @Column()
    walletPrice: string;

    @ApiProperty({ example: '0.00' })
    @Column()
    shippingCharge: string;

    @ApiProperty({ example: '12.00' })
    @Column()
    tax: string;

    @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
    items: InvoiceItem[];

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
