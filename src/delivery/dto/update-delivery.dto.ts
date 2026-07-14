import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateDeliveryDto {
  @ApiProperty({ example: 'Rahul Sharma', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  delivery_partner_name?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  delivery_partner_phone?: string;

  @ApiProperty({ example: '2026-07-14T18:30:00.000Z', required: false })
  @IsOptional()
  @IsISO8601()
  estimated_delivery_time?: string;
}
