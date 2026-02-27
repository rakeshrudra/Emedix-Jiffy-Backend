import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class InvoiceItemDto {
    @ApiProperty({ example: 'MED10001' })
    @IsNotEmpty()
    @IsString()
    item_no: string;

    @ApiProperty({ example: '2' })
    @IsNotEmpty()
    @IsString()
    qty: string;

    @ApiProperty({ example: '22.00' })
    @IsNotEmpty()
    @IsString()
    discount_price: string;

    @ApiProperty({ example: '25.00' })
    @IsNotEmpty()
    @IsString()
    price: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @IsNotEmpty()
    @IsString()
    item_name: string;

    @ApiProperty({ example: '44.00' })
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
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'INV10045' })
    @IsNotEmpty()
    @IsString()
    invoice_no: string;

    @ApiProperty({ example: '2026-02-27', required: false })
    @IsOptional()
    @IsString()
    invoice_date?: string;

    @ApiProperty({ example: 'ORD10045', required: false })
    @IsOptional()
    @IsString()
    order_no?: string;

    @ApiProperty({ example: 'Shipped', required: false })
    @IsOptional()
    @IsString()
    order_status?: string;

    @ApiProperty({ example: 'Rahul Sharma' })
    @IsNotEmpty()
    @IsString()
    customername: string;

    @ApiProperty({ example: 'MG Road, Andheri East', required: false })
    @IsOptional()
    @IsString()
    address1?: string;

    @ApiProperty({ example: 'Mumbai', required: false })
    @IsOptional()
    @IsString()
    customercity?: string;

    @ApiProperty({ example: 'India', required: false })
    @IsOptional()
    @IsString()
    customercountry?: string;

    @ApiProperty({ example: '400069', required: false })
    @IsOptional()
    @IsString()
    customerzipcode?: string;

    @ApiProperty({ example: 'Online', required: false })
    @IsOptional()
    @IsString()
    paymentmethod?: string;

    @ApiProperty({ example: '9876543210', required: false })
    @IsOptional()
    @IsString()
    phone_no?: string;

    @ApiProperty({ example: 'UPI', required: false })
    @IsOptional()
    @IsString()
    payment_type?: string;

    @ApiProperty({ example: '', required: false })
    @IsOptional()
    @IsString()
    coupon_code?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    coupon_discount?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    coupon_price?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    wallet_price?: string;

    @ApiProperty({ example: '0.00', required: false })
    @IsOptional()
    @IsString()
    shipping_charge?: string;

    @ApiProperty({ example: '12.00', required: false })
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
