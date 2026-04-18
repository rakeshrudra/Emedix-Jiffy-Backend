import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  MaxLength,
  MinLength
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddAddressDto {
  @ApiProperty({ example: '12 MG Road', description: 'Street, House No, Building' })
  @IsNotEmpty({ message: 'Address line is required' })
  @IsString()
  @MinLength(3, { message: 'Address is too short' })
  @MaxLength(255, { message: 'Address is too long' })
  @Transform(({ value }) => value?.trim())
  address_line: string;

  @ApiProperty({ example: 'Hyderabad' })
  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ example: 'Telangana' })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  state: string;

  @ApiProperty({ example: '500001', description: '6-digit Indian postal code' })
  @IsNotEmpty({ message: 'Pincode is required' })
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Please enter a valid 6-digit Indian pincode' })
  pincode: string;

  @ApiProperty({ example: 'Home', required: false, description: 'Type of address (Home, Work, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  label?: string;

  @ApiProperty({ example: 'Floor 2, Tower B', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address_line_2?: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  country?: string;
}
