import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminSignupDto {
  @ApiProperty({ example: '2' })
  @IsNotEmpty()
  @IsString()
  store_id: string;
}
