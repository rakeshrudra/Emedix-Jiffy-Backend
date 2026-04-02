import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class AddAddressDto {
  @ApiProperty({ example: '12 MG Road', description: 'Street / building details' })
  @IsString()
  address_line: string;

  @ApiProperty({ example: 'Hyderabad' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Telangana' })
  @IsString()
  state: string;

  @ApiProperty({ example: '500001', description: '6-digit Indian postal code' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be a valid 6-digit code' })
  pincode: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  country: string;

  @ApiProperty({ example: 'Office', required: false })
  @IsOptional()
  @IsString()
  label: string;

  @ApiProperty({ example: 'Floor 2, Tower B', required: false })
  @IsOptional()
  @IsString()
  address_line_2?: string;
}
