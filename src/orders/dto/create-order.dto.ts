import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    ValidateIf,
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

    @ApiProperty({
        example: '2026-07-24',
        description: 'Scheduled order date in YYYY-MM-DD format. Must be sent with scedule_starttime and schedule_endtime.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scedule_starttime !== undefined || o.schedule_endtime !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduled_date must be YYYY-MM-DD' })
    scheduled_date?: string;

    @ApiProperty({
        example: '11:00:00',
        description: 'Schedule slot start time in HH:MM:SS format. Must be sent with scheduled_date and schedule_endtime.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scedule_starttime !== undefined || o.schedule_endtime !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'scedule_starttime must be HH:MM:SS' })
    scedule_starttime?: string;

    @ApiProperty({
        example: '12:00:00',
        description: 'Schedule slot end time in HH:MM:SS format. Must be sent with scheduled_date and scedule_starttime.',
        required: false,
    })
    @ValidateIf((o) => o.scheduled_date !== undefined || o.scedule_starttime !== undefined || o.schedule_endtime !== undefined)
    @IsNotEmpty()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'schedule_endtime must be HH:MM:SS' })
    schedule_endtime?: string;
}
