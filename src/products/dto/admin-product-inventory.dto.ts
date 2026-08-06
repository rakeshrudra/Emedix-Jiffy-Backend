import { ApiProperty } from '@nestjs/swagger';

export class AdminProductInventoryDto {
    @ApiProperty({ example: 'MED10001' })
    product_code: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    product_name: string;

    @ApiProperty({ example: 'Cipla Ltd' })
    product_company: string;

    @ApiProperty({ example: 'Yes', enum: ['Yes', 'No'] })
    prescription_required: 'Yes' | 'No';

    @ApiProperty({ example: 25.0 })
    product_price: number;

    @ApiProperty({ example: 22.0 })
    product_discount_price: number;

    @ApiProperty({ example: 0 })
    product_stock: number;
}
