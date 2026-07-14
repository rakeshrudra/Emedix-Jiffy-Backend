import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class AssignDeliveryDto {
  @ApiProperty({ example: 'EJ-20260530-0001' })
  @IsNotEmpty()
  @IsString()
  order_no: string;

  @ApiProperty({ example: '001' })
  @IsNotEmpty()
  @IsString()
  store_id: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  delivery_partner_name: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  delivery_partner_phone: string;

  @ApiProperty({ example: '2026-07-14T18:30:00.000Z', required: false })
  @IsOptional()
  @IsISO8601()
  estimated_delivery_time?: string;
}
