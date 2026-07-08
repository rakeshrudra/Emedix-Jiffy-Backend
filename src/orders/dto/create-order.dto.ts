import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateOrderDto {
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({
        example: 'uuid-v4-generated-by-client',
        description: 'UUID generated client-side to prevent duplicate orders on retry',
    })
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

    @ApiProperty({
        example: '6f4db8bc-a6da-4fb9-bc2c-e3c49515b4be',
        description: 'Saved address ID from the user\'s address book',
    })
    @IsNotEmpty()
    @IsUUID()
    delivery_address_id: string;

    @ApiProperty({ example: ['https://storage.example.com/rx1.jpg'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    prescription_urls?: string[];
}
