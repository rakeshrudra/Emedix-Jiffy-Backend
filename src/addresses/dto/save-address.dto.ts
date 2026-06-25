import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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
  @ApiProperty({ example: '6f4db8bc-a6da-4fb9-bc2c-e3c49515b4be', required: false })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ enum: AddressLabel, example: AddressLabel.Home, required: false })
  @IsOptional()
  @IsEnum(AddressLabel)
  label?: AddressLabel;

  @ApiProperty({ example: 'Flat 4, Krishna Apartments', description: 'House / flat / building — user fills this in' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_1: string;

  @ApiProperty({ example: 'Rajpur Road', description: 'Street / locality — pre-filled from geocoding', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_2?: string;

  @ApiProperty({ example: 'Rajpur Road, Dehradun, Uttarakhand 248001, India' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  formatted_address: string;

  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', description: 'Google Place ID — set when saving from autocomplete flow', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  place_id?: string;

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

  @ApiProperty({
    example: 'gps',
    enum: ['gps', 'manual', 'places'],
    description: 'gps = detected via device GPS | manual = typed + geocoded | places = Google Places Autocomplete',
    required: false,
  })
  @IsOptional()
  @IsEnum(['gps', 'manual', 'places'])
  source?: 'gps' | 'manual' | 'places';

  @ApiProperty({ example: false, required: false, description: 'Set this as the default delivery address' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
