import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    example: 'Out of stock',
    required: false,
    description: 'Optional reason for cancelling the order',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
