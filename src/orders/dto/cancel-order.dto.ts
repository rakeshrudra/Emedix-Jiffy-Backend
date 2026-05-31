import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
    @ApiProperty({ example: 'Changed my mind', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}
