import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProductSearchQueryDto {
    @ApiProperty({ example: 'paracetamol', description: 'Search text' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ example: '001', description: 'Store ID' })
    @IsOptional()
    @IsString()
    storeId?: string;
}
