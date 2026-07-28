import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    ValidateIf,
} from 'class-validator';
import { FulfillmentType } from '../entities/order.entity';

export class CreateOrderDto {
    @ApiProperty({ example: '001' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({
        enum: FulfillmentType,
        example: FulfillmentType.PICKUP,
        description: 'PICKUP (V1) or DELIVERY (V2). DELIVERY also requires the store to reach user_address_id.',
    })
    @IsNotEmpty()
    @IsEnum(FulfillmentType)
    fulfillment_type: FulfillmentType;

    @ApiProperty({
        example: 'uuid-v4-generated-by-client',
        description: 'UUID generated client-side to prevent duplicate orders on retry',
    })
    @IsNotEmpty()
    @IsUUID()
    idempotency_key: string;

    @ApiProperty({
        example: '6f4db8bc-a6da-4fb9-bc2c-e3c49515b4be',
        description: 'Saved address ID from the user\'s address book. Always required — tracked as the order\'s user_address regardless of fulfillment_type.',
    })
    @IsNotEmpty()
    @IsUUID()
    user_address_id: string;

    @ApiProperty({ example: ['https://storage.example.com/rx1.jpg'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    prescription_urls?: string[];

    @ApiProperty({
        example: '2026-07-24',
        description: 'Scheduled order date in YYYY-MM-DD format. Must be sent with scheduled_start_time and scheduled_end_time.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scheduled_start_time !== undefined || o.scheduled_end_time !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduled_date must be YYYY-MM-DD' })
    scheduled_date?: string;

    @ApiProperty({
        example: '11:00:00',
        description: 'Schedule slot start time in HH:MM:SS format. Must be sent with scheduled_date and scheduled_end_time.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scheduled_start_time !== undefined || o.scheduled_end_time !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'scheduled_start_time must be HH:MM:SS' })
    scheduled_start_time?: string;

    @ApiProperty({
        example: '12:00:00',
        description: 'Schedule slot end time in HH:MM:SS format. Must be sent with scheduled_date and scheduled_start_time.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scheduled_start_time !== undefined || o.scheduled_end_time !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'scheduled_end_time must be HH:MM:SS' })
    scheduled_end_time?: string;
}
