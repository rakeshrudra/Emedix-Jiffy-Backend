import { ApiProperty } from '@nestjs/swagger';

export class ProductStockDto {
    @ApiProperty({ example: '10000001' })
    product_code: string;

    @ApiProperty({ example: 108.0 })
    product_stock: number;
}
