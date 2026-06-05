import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum AddressLabel {
  Home = 'Home',
  Work = 'Work',
  Other = 'Other',
}

export class SaveAddressDto {
  @ApiProperty({ enum: AddressLabel, example: AddressLabel.Home, required: false })
  @IsOptional()
  @IsEnum(AddressLabel)
  label?: AddressLabel;

  @ApiProperty({ example: '12 MG Road, Andheri East' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_1: string;

  @ApiProperty({ example: 'Floor 2, Tower B', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_2?: string;

  @ApiProperty({ example: '12 MG Road, Andheri East, Mumbai, Maharashtra 400069, India' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  formatted_address: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '400069' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Enter a valid 6-digit Indian pincode' })
  pincode: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;

  @ApiProperty({ example: 19.0785 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 72.8781 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'gps', enum: ['gps', 'manual'], required: false })
  @IsOptional()
  @IsEnum(['gps', 'manual'])
  source?: 'gps' | 'manual';

  @ApiProperty({ example: false, required: false, description: 'Set this as the default delivery address' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
