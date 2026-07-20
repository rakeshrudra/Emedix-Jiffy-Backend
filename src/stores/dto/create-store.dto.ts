import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: '001', description: 'Unique Swil ERP store code' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  store_id: string;

  @ApiProperty({ example: 'Jiffy Rajpur Road', description: 'Store name as used in the Emedix system' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  emedix_name: string;

  @ApiProperty({ example: 'Jiffy Pharmacy - Rajpur Road' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'Shop 12, Krishna Complex', description: 'Street-level address' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_1: string;

  @ApiProperty({ example: 'Shop 12, Krishna Complex, Rajpur Road, Dehradun, Uttarakhand 248001, India' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  formatted_address: string;

  @ApiProperty({ example: 'Dehradun' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Uttarakhand' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '248001' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Enter a valid 6-digit Indian pincode' })
  pincode: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;

  @ApiProperty({ example: 30.3165 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 78.0322 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 5.0, description: 'Delivery radius in km', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  delivery_radius_km?: number;

  @ApiProperty({ example: '9876543210', description: '10-digit phone number', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian phone number' })
  phone?: string;

  @ApiProperty({ example: '09:00:00', description: 'Daily opening time (HH:MM:SS)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'opening_time must be HH:MM:SS' })
  opening_time?: string;

  @ApiProperty({ example: '22:00:00', description: 'Daily closing time (HH:MM:SS)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'closing_time must be HH:MM:SS' })
  closing_time?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
