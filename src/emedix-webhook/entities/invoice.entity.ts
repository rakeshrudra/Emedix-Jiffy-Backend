import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'SIB1' })
    @Column({ unique: true })
    invoiceNo: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true, unique: true })
    orderNo: string;

    @ApiProperty({ example: 'Shipped' })
    @Column({ nullable: true })
    orderStatus: string;

    @ApiProperty({ example: 'ANIKET PATIL' })
    @Column()
    customerName: string;

    @ApiProperty({ example: '' })
    @Column({ type: 'text', nullable: true })
    address1: string;

    @ApiProperty({ example: 'Not Define' })
    @Column({ nullable: true })
    customerCity: string;

    @ApiProperty({ example: 'Not Define' })
    @Column({ nullable: true })
    customerCountry: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    customerZipcode: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    paymentMethod: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    phoneNo: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    paymentType: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    couponCode: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    couponDiscount: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    couponPrice: string;

    @ApiProperty({ example: '' })
    @Column({ nullable: true })
    walletPrice: string;

    @ApiProperty({ example: '0.00' })
    @Column({ nullable: true })
    shippingCharge: string;

    @ApiProperty({ example: '133.92' })
    @Column({ nullable: true })
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
