import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class InvoiceItemDto {
    @ApiProperty({ example: 'MED10001' })
    @IsNotEmpty()
    @IsString()
    product_code: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ example: '25.00' })
    @IsNotEmpty()
    @IsString()
    product_price: string;

    @ApiProperty({ example: '22.00' })
    @IsNotEmpty()
    @IsString()
    product_discount_price: string;

    @ApiProperty({ example: '2' })
    @IsNotEmpty()
    @IsString()
    qty: string;

    @ApiProperty({ example: '44.00' })
    @IsNotEmpty()
    @IsString()
    total: string;
}

export class InvoiceDto {
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'INV10045' })
    @IsNotEmpty()
    @IsString()
    invoice_no: string;

    @ApiProperty({ example: '2026-02-27' })
    @IsNotEmpty()
    @IsString()
    invoice_date: string;

    @ApiProperty({ example: 'EJ-20260606-0001' })
    @IsNotEmpty()
    @IsString()
    order_no: string;

    @ApiProperty({ example: '12.00' })
    @IsNotEmpty()
    @IsString()
    tax: string;

    @ApiProperty({ example: '400.00' })
    @IsNotEmpty()
    @IsString()
    subtotal: string;

    @ApiProperty({ example: '452.00' })
    @IsNotEmpty()
    @IsString()
    grand_total: string;

    @ApiProperty({ example: '40.00', required: false })
    @IsOptional()
    @IsString()
    shipping_charge?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    wallet_price?: string;

    @ApiProperty({ type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];
}

export class InvoiceUploadDto {
    @ApiProperty({ type: [InvoiceDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceDto)
    result: InvoiceDto[];
}
