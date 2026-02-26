import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'Paracetamol 500mg' })
    @Column()
    productName: string;

    @ApiProperty({ example: '10000001' })
    @Column({ unique: true })
    productCode: string;

    @ApiProperty({ example: 'ASHISH' })
    @Column({ nullable: true })
    productCompany: string;

    @ApiProperty({ example: 'no' })
    @Column({ nullable: true })
    prescriptionRequired: string;

    @ApiProperty({ example: 17578.125 })
    @Column('decimal', { precision: 12, scale: 4 })
    productPrice: number;

    @ApiProperty({ example: 17578.125 })
    @Column('decimal', { precision: 12, scale: 4 })
    productDiscountPrice: number;

    @ApiProperty({ example: 'TV' })
    @Column({ nullable: true })
    productType: string;

    @ApiProperty({ example: '1' })
    @Column({ nullable: true })
    packagingOfMedicines: string;

    @ApiProperty({ example: '' })
    @Column({ type: 'text', nullable: true })
    productComposition: string;

    @ApiProperty({ example: 'Enable' })
    @Column({ nullable: true })
    status: string;

    @ApiProperty({ example: 108.0 })
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    productStock: number;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
