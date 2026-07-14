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
@Unique(['storeId', 'productCode'])
export class ProductSwil {
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
    @Column()
    productCompany: string;

    @ApiProperty({ example: '3004' })
    @Column()
    hsnCode: string;

    @ApiProperty({ example: 'no' })
    @Column()
    prescriptionRequired: string;

    @ApiProperty({ example: '25.00' })
    @Column()
    productPrice: string;

    @ApiProperty({ example: '22.00' })
    @Column()
    productDiscountPrice: string;

    @ApiProperty({ example: 'Tablet' })
    @Column()
    productType: string;

    @ApiProperty({ example: '10 Tablets per Strip' })
    @Column()
    packagingOfMedicines: string;

    @ApiProperty({ example: 'Paracetamol 500mg' })
    @Column({ type: 'text' })
    productComposition: string;

    @ApiProperty({ example: 'Enable' })
    @Column()
    status: string;

    @ApiProperty({ example: '250' })
    @Column()
    productStock: string;

    @ApiProperty({ example: '2026-02-27 10:30:00' })
    @Column()
    lastUpdated: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
