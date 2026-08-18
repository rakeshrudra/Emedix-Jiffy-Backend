import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AdminRole } from '../enums/admin-role.enum';

export class AdminProvisionDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4e9a-bc12-abcdef123456', description: 'Identity id issued by Emedix Auth Service' })
  @IsUUID()
  identity_id: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile_no must be a valid 10-digit Indian phone number' })
  mobile_no: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }) => value?.trim())
  username: string;

  @ApiProperty({ example: '2' })
  @IsNotEmpty()
  @IsString()
  store_id: string;

  @ApiProperty({ enum: AdminRole, example: AdminRole.ADMIN, required: false })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
