import { ApiProperty } from '@nestjs/swagger';

export class ProductStockDto {
    @ApiProperty({ example: '001' })
    store_id: string;

    @ApiProperty({ example: 'MED10001' })
    product_code: string;

    @ApiProperty({ example: '250' })
    product_stock: string;
}
