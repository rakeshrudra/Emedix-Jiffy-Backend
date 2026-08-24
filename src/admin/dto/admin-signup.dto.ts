import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminSignupDto {
  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  store_id?: string;
}
