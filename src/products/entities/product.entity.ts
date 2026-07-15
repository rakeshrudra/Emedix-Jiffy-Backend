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

export enum ProductStatus {
    ENABLE = 'Enable',
    DISABLE = 'Disable',
}

@Entity('products')
@Unique(['storeId', 'productCode'])
export class Product {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '001' })
    @Column({ name: 'store_id' })
    storeId: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @Index()
    @Column()
    productName: string;

    @ApiProperty({ example: 'MED10001' })
    @Column()
    productCode: string;

    @ApiProperty({ example: 'Cipla Ltd' })
    @Index('IDX_products_product_company')
    @Column()
    productCompany: string;

    @ApiProperty({ example: '3004' })
    @Column()
    hsnCode: string;

    @ApiProperty({ example: false })
    @Column({ type: 'boolean', default: false })
    prescriptionRequired: boolean;

    @ApiProperty({ example: 25.0 })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    productPrice: number;

    @ApiProperty({ example: 22.0 })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    productDiscountPrice: number;

    @ApiProperty({ example: 'Tablet' })
    @Column()
    productType: string;

    @ApiProperty({ example: '10 Tablets per Strip' })
    @Column()
    packagingOfMedicines: string;

    @ApiProperty({ example: 'Paracetamol 500mg' })
    @Index()
    @Column()
    productComposition: string;

    @ApiProperty({ enum: ProductStatus, example: ProductStatus.ENABLE })
    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ENABLE })
    status: ProductStatus;

    @ApiProperty({ example: 250 })
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    productStock: number;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
