import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  password: string;
}
