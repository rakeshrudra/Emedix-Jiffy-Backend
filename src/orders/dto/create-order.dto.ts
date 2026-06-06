import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
    IsInt,
} from 'class-validator';

export class OrderItemDto {
    @ApiProperty({ example: 'MED10001' })
    @IsNotEmpty()
    @IsString()
    product_code: string;

    @ApiProperty({ example: 'Paracetamol 500mg Tablet' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ example: 'Cipla Ltd', required: false })
    @IsOptional()
    @IsString()
    product_company?: string;

    @ApiProperty({ example: 'Tablet', required: false })
    @IsOptional()
    @IsString()
    product_type?: string;

    @ApiProperty({ example: '10 Tablets per Strip', required: false })
    @IsOptional()
    @IsString()
    packaging_of_medicines?: string;

    @ApiProperty({ example: 'Paracetamol 500mg', required: false })
    @IsOptional()
    @IsString()
    product_composition?: string;

    @ApiProperty({ example: 2 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    qty: number;

    @ApiProperty({ example: '25.00' })
    @IsNotEmpty()
    @IsString()
    unit_price: string;

    @ApiProperty({ example: '22.00' })
    @IsNotEmpty()
    @IsString()
    discount_price: string;

    @ApiProperty({ example: '3004', required: false })
    @IsOptional()
    @IsString()
    hsn_code?: string;
}

export class OrderAddressDto {
    @ApiProperty({ example: 'MG Road, Andheri East, Mumbai - 400069' })
    @IsNotEmpty()
    @IsString()
    formatted_address: string;

    @ApiProperty({ example: 'Mumbai' })
    @IsNotEmpty()
    @IsString()
    city: string;

    @ApiProperty({ example: 'Maharashtra' })
    @IsNotEmpty()
    @IsString()
    state: string;

    @ApiProperty({ example: '400069' })
    @IsNotEmpty()
    @IsString()
    pincode: string;

    @ApiProperty({ example: 19.0785 })
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @ApiProperty({ example: 72.8781 })
    @IsNotEmpty()
    @IsNumber()
    longitude: number;
}

export class CreateOrderDto {
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'uuid-v4-generated-by-client', description: 'UUID generated client-side to prevent duplicate orders on retry' })
    @IsNotEmpty()
    @IsUUID()
    idempotency_key: string;

    @ApiProperty({ example: 'UPI', description: 'UPI | CARD | COD' })
    @IsNotEmpty()
    @IsString()
    payment_method: string;

    @ApiProperty({ example: 'PAY123456', required: false })
    @IsOptional()
    @IsString()
    payment_gateway_ref?: string;

    @ApiProperty({ example: 'Rahul Sharma' })
    @IsNotEmpty()
    @IsString()
    customer_name: string;

    @ApiProperty({ example: '9876543210' })
    @IsNotEmpty()
    @IsString()
    customer_phone: string;

    @ApiProperty({ type: OrderAddressDto })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => OrderAddressDto)
    delivery_address: OrderAddressDto;

    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ example: ['https://storage.example.com/rx1.jpg'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    prescription_urls?: string[];

    @ApiProperty({ example: 490.0 })
    @IsNotEmpty()
    @IsNumber()
    subtotal: number;

    @ApiProperty({ example: 40.0 })
    @IsNotEmpty()
    @IsNumber()
    delivery_charge: number;

    @ApiProperty({ example: 0.0, required: false })
    @IsOptional()
    @IsNumber()
    discount?: number;

    @ApiProperty({ example: 530.0 })
    @IsNotEmpty()
    @IsNumber()
    total_amount: number;
}
