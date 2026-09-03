import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum ProductStatus {
    ENABLE = 'Enable',
    DISABLE = 'Disable',
}

@Entity('products')
@Unique(['store_id', 'product_code'])
export class Product {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '001' })
    @Column({ name: 'store_id' })
    store_id: string;

    @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'store_id', referencedColumnName: 'store_id' })
    store: Store;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Index()
    @Column({ name: 'product_name' })
    product_name: string;

    @ApiProperty({ example: 'MED10001' })
    @Column({ name: 'product_code' })
    product_code: string;

    @ApiProperty({ example: 'Cipla Ltd' })
    @Index()
    @Column({ name: 'product_company' })
    product_company: string;

    @ApiProperty({ example: '3004' })
    @Column({ name: 'hsn_code' })
    hsn_code: string;

    @ApiProperty({ example: false })
    @Column({ name: 'prescription_required', type: 'boolean', default: false })
    prescription_required: boolean;

    @ApiProperty({ example: 25.0 })
    @Column({ name: 'product_price', type: 'decimal', precision: 10, scale: 2 })
    product_price: number;

    @ApiProperty({ example: 22.0 })
    @Column({
        name: 'product_discount_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    product_discount_price: number;

    @ApiProperty({ example: 'Tablet' })
    @Column({ name: 'product_type' })
    product_type: string;

    @ApiProperty({ example: '10 Tablets per Strip' })
    @Column({ name: 'packaging_of_medicines' })
    packaging_of_medicines: string;

    @ApiProperty({ example: 'Paracetamol 500mg' })
    @Index()
    @Column({ name: 'product_composition' })
    product_composition: string;

    @ApiProperty({ enum: ProductStatus, example: ProductStatus.ENABLE })
    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ENABLE })
    status: ProductStatus;

    @ApiProperty({ example: 250 })
    @Column({
        name: 'product_stock',
        type: 'int',
        default: 0,
    })
    product_stock: number;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
