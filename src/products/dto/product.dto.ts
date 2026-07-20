import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ProductDto {
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ example: 'MED10001' })
    @IsNotEmpty()
    @IsString()
    product_code: string;

    @ApiProperty({ example: 'Cipla Ltd', required: false })
    @IsOptional()
    @IsString()
    product_company?: string;

    @ApiProperty({ example: '3004', required: false })
    @IsOptional()
    @IsString()
    'HSN/SAC'?: string;

    @ApiProperty({ example: 'no', required: false, enum: ['yes', 'no'] })
    @IsOptional()
    @IsIn(['yes', 'no'])
    prescription_required?: string;

    @ApiProperty({ example: '25.00', required: false })
    @IsOptional()
    @IsNumberString()
    product_price?: string;

    @ApiProperty({ example: '22.00', required: false })
    @IsOptional()
    @IsNumberString()
    product_discount_price?: string;

    @ApiProperty({ example: 'Tablet', required: false })
    @IsOptional()
    @IsString()
    product_type?: string;

    @ApiProperty({ example: '10 Tablets per Strip', required: false })
    @IsOptional()
    @IsString()
    packaging_of_medicines?: string;

    @ApiProperty({ example: 'Paracetamol 500mg', required: false })
    @IsOptional()
    @IsString()
    product_composition?: string;

    @ApiProperty({ example: 'Enable', required: false, enum: ['Enable', 'Disable'] })
    @IsOptional()
    @IsIn(['Enable', 'Disable'])
    status?: string;

    @ApiProperty({ example: '250', required: false })
    @IsOptional()
    @IsNumberString()
    product_stock?: string;

    @ApiProperty({ example: '2026-02-27 10:30:00', required: false })
    @IsOptional()
    @IsString()
    last_updated?: string;
}
