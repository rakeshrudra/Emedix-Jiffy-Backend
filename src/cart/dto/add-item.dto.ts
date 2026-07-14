import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ example: 'MED10001' })
  @IsNotEmpty()
  @IsString()
  product_code: string;

  @ApiProperty({ example: '001' })
  @IsNotEmpty()
  @IsString()
  store_id: string;
}
