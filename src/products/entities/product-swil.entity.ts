import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    Index,
} from 'typeorm';

/**
 * Legacy Swil ERP product table (products_swil). Frozen schema from before
 * the V1 ERP-cutover — kept alive only for the /emedix-webhook/* endpoints.
 * Not read by product browsing, cart, or order creation; see Product for
 * the live table those use.
 */
@Entity('products_swil')
@Unique(['store_id', 'product_code'])
export class ProductSwil {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '001' })
    @Column({ name: 'store_id' })
    store_id: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Index()
    @Column({ name: 'product_name' })
    product_name: string;

    @ApiProperty({ example: 'MED10001' })
    @Column({ name: 'product_code' })
    product_code: string;

    @ApiProperty({ example: 'Cipla Ltd' })
    @Column({ name: 'product_company' })
    product_company: string;

    @ApiProperty({ example: '3004' })
    @Column({ name: 'hsn_code' })
    hsn_code: string;

    @ApiProperty({ example: 'no' })
    @Column({ name: 'prescription_required' })
    prescription_required: string;

    @ApiProperty({ example: '25.00' })
    @Column({ name: 'product_price' })
    product_price: string;

    @ApiProperty({ example: '22.00' })
    @Column({ name: 'product_discount_price' })
    product_discount_price: string;

    @ApiProperty({ example: 'Tablet' })
    @Column({ name: 'product_type' })
    product_type: string;

    @ApiProperty({ example: '10 Tablets per Strip' })
    @Column({ name: 'packaging_of_medicines' })
    packaging_of_medicines: string;

    @ApiProperty({ example: 'Paracetamol 500mg' })
    @Column({ name: 'product_composition', type: 'text' })
    product_composition: string;

    @ApiProperty({ example: 'Enable' })
    @Column()
    status: string;

    @ApiProperty({ example: '250' })
    @Column({ name: 'product_stock' })
    product_stock: string;

    @ApiProperty({ example: '2026-02-27 10:30:00' })
    @Column({ name: 'last_updated' })
    last_updated: string;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
