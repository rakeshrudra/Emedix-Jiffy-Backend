import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
    @ApiProperty({ example: '001' })
    store_id: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    product_name: string;

    @ApiProperty({ example: 'MED10001' })
    product_code: string;

    @ApiProperty({ example: 'Cipla Ltd', required: false })
    product_company?: string;

    @ApiProperty({ example: '3004', required: false })
    'HSN/SAC'?: string;

    @ApiProperty({ example: 'no', required: false })
    prescription_required?: string;

    @ApiProperty({ example: '25.00', required: false })
    product_price?: string;

    @ApiProperty({ example: '22.00', required: false })
    product_discount_price?: string;

    @ApiProperty({ example: 'Tablet', required: false })
    product_type?: string;

    @ApiProperty({ example: '10 Tablets per Strip', required: false })
    packaging_of_medicines?: string;

    @ApiProperty({ example: 'Paracetamol 500mg', required: false })
    product_composition?: string;

    @ApiProperty({ example: 'Enable', required: false })
    status?: string;

    @ApiProperty({ example: '250', required: false })
    product_stock?: string;

    @ApiProperty({ example: '2026-02-27 10:30:00', required: false })
    last_updated?: string;
}
