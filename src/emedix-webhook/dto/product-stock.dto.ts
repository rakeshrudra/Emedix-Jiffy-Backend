import { ApiProperty } from '@nestjs/swagger';

export class ProductStockDto {
    @ApiProperty({ example: 'STORE-001', description: 'Store identifier' })
    'Store Id': string;

    @ApiProperty({ example: 'Paracetamol 500mg', description: 'Product display name' })
    'NameToDisplay': string;

    @ApiProperty({ example: 'PROD-1234', description: 'Product identifier' })
    'Product Id': string;

    @ApiProperty({ example: '3004', description: 'HSN/SAC code', required: false })
    'HSN/SAC'?: string;

    @ApiProperty({ example: 150, description: 'Stock quantity' })
    'Stock': number;

    @ApiProperty({ example: 'Strips', description: 'Unit of stock', required: false })
    'StockUnit'?: string;

    @ApiProperty({ example: 7500, description: 'Total stock value' })
    'Stock Value': number;

    @ApiProperty({ example: 'Tablets', description: 'Product category', required: false })
    'Category'?: string;

    @ApiProperty({ example: 'OTC', description: 'Marketing group', required: false })
    'Marketing Group'?: string;

    @ApiProperty({ example: 'Sun Pharma', description: 'Manufacturer', required: false })
    'Manufacturing Co'?: string;

    @ApiProperty({ example: 50, description: 'Maximum retail price' })
    'MRP': number;

    @ApiProperty({ example: 45, description: 'Rate' })
    'Rate': number;

    @ApiProperty({ example: 'Active', description: 'Product status', required: false })
    'Status'?: string;

    @ApiProperty({ example: 'H', description: 'Schedule category', required: false })
    'Schedule'?: string;

    @ApiProperty({ example: '2026-02-25', description: 'Last update timestamp', required: false })
    'LastUpdate'?: string;
}
