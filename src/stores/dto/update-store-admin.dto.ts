import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStoreAdminDto {
  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian phone number' })
  phone?: string;

  @ApiProperty({ example: '09:00:00', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'opening_time must be HH:MM:SS' })
  opening_time?: string;

  @ApiProperty({ example: '22:00:00', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { message: 'closing_time must be HH:MM:SS' })
  closing_time?: string;

  @ApiProperty({ example: 5.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  delivery_radius_km?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ example: 'Shop 12, Krishna Complex', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_1?: string;

  @ApiProperty({ example: 'Shop 12, Krishna Complex, Rajpur Road, Dehradun, Uttarakhand 248001, India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  formatted_address?: string;

  @ApiProperty({ example: 'Dehradun', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiProperty({ example: 'Uttarakhand', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  state?: string;

  @ApiProperty({ example: '248001', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Enter a valid 6-digit Indian pincode' })
  pincode?: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiProperty({ example: 30.3165, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ example: 78.0322, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
