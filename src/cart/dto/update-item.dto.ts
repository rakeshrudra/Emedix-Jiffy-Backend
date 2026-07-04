import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateItemDto {
  @ApiProperty({ example: 2, description: 'Set to 0 to remove item' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}
