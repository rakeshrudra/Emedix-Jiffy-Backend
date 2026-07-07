import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OptionalCartStoreQueryDto {
  @ApiPropertyOptional({ example: '001' })
  @IsOptional()
  @IsString()
  store_id?: string;
}

export class CartStoreQueryDto {
  @ApiProperty({ example: '001' })
  @IsNotEmpty()
  @IsString()
  store_id: string;
}
