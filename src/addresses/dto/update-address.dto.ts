import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AddressLabel } from './save-address.dto';

export class UpdateAddressDto {
  @ApiProperty({ enum: AddressLabel, example: AddressLabel.Work, required: false })
  @IsOptional()
  @IsEnum(AddressLabel)
  label?: AddressLabel;

  @ApiProperty({ example: true, required: false, description: 'Set as the default delivery address' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
