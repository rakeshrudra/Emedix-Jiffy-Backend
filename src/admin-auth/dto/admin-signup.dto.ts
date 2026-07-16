import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AdminSignupDto {
  @ApiProperty({ example: 'shaikpet_admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  password: string;

  @ApiProperty({ example: '2' })
  @IsString()
  store_id: string;
}
