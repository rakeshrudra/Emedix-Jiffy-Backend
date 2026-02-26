import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
    @ApiProperty({ example: 'panasonic panasonicTV 32 inch' })
    product_name: string;

    @ApiProperty({ example: '10000001' })
    product_code: string;

    @ApiProperty({ example: 'ASHISH', required: false })
    product_company?: string;

    @ApiProperty({ example: 'no', required: false })
    prescription_required?: string;

    @ApiProperty({ example: 17578.125 })
    product_price: number;

    @ApiProperty({ example: 17578.125 })
    product_discount_price: number;

    @ApiProperty({ example: 'TV', required: false })
    product_type?: string;

    @ApiProperty({ example: '1', required: false })
    packaging_of_medicines?: string;

    @ApiProperty({ example: '', required: false })
    product_composition?: string;

    @ApiProperty({ example: 'Enable', required: false })
    status?: string;
}
