import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class InvoiceItemDto {
    @ApiProperty({ example: '10000008' })
    @IsNotEmpty()
    @IsString()
    item_no: string;

    @ApiProperty({ example: '5.00' })
    @IsNotEmpty()
    @IsString()
    qty: string;

    @ApiProperty({ example: '250.00' })
    @IsNotEmpty()
    @IsString()
    discount_price: string;

    @ApiProperty({ example: '100.00' })
    @IsNotEmpty()
    @IsString()
    price: string;

    @ApiProperty({ example: '2 MUCH GOLD 6 CAP' })
    @IsNotEmpty()
    @IsString()
    item_name: string;

    @ApiProperty({ example: '1250.00' })
    @IsNotEmpty()
    @IsString()
    total: string;

    @ApiProperty({ example: '0', required: false })
    @IsOptional()
    @IsString()
    is_return?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    return_comment?: string;
}

export class InvoiceDto {
    @ApiProperty({ example: 'SIB1' })
    @IsNotEmpty()
    @IsString()
    invoice_no: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    order_no?: string;

    @ApiProperty({ example: 'Shipped', required: false })
    @IsOptional()
    @IsString()
    order_status?: string;

    @ApiProperty({ example: 'ANIKET PATIL' })
    @IsNotEmpty()
    @IsString()
    customername: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    address1?: string;

    @ApiProperty({ example: 'Not Define', required: false })
    @IsOptional()
    @IsString()
    customercity?: string;

    @ApiProperty({ example: 'Not Define', required: false })
    @IsOptional()
    @IsString()
    customercountry?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    customerzipcode?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    paymentmethod?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    phone_no?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    payment_type?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    coupon_code?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    coupon_discount?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    coupon_price?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    wallet_price?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    shipping_charge?: string;

    @ApiProperty({ example: '133.92', required: false })
    @IsOptional()
    @IsString()
    tax?: string;

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
