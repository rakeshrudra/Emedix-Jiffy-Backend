import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProductStockDto {
    @Expose({ name: 'Store Id' })
    @IsNotEmpty()
    @IsString()
    storeId: string;

    @Expose({ name: 'NameToDisplay' })
    @IsNotEmpty()
    @IsString()
    nameToDisplay: string;

    @Expose({ name: 'Product Id' })
    @IsNotEmpty()
    @IsString()
    productId: string;

    @Expose({ name: 'HSN/SAC' })
    @IsOptional()
    @IsString()
    hsnSac: string;

    @Expose({ name: 'Stock' })
    @IsNotEmpty()
    stock: number;

    @Expose({ name: 'StockUnit' })
    @IsOptional()
    @IsString()
    stockUnit: string;

    @Expose({ name: 'Stock Value' })
    @IsNotEmpty()
    stockValue: number;

    @Expose({ name: 'Category' })
    @IsOptional()
    @IsString()
    category: string;

    @Expose({ name: 'Marketing Group' })
    @IsOptional()
    @IsString()
    marketingGroup: string;

    @Expose({ name: 'Manufacturing Co' })
    @IsOptional()
    @IsString()
    manufacturingCo: string;

    @Expose({ name: 'MRP' })
    @IsNotEmpty()
    mrp: number;

    @Expose({ name: 'Rate' })
    @IsNotEmpty()
    rate: number;

    @Expose({ name: 'Status' })
    @IsOptional()
    @IsString()
    status: string;

    @Expose({ name: 'Schedule' })
    @IsOptional()
    @IsString()
    schedule: string;

    @Expose({ name: 'LastUpdate' })
    @IsOptional()
    @IsString()
    lastUpdate: string;
}
