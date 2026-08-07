import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminProductInventoryQueryDto {
    @ApiPropertyOptional({ example: 'paracetamol', description: 'Search by product name, code, company, or composition' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 50, default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;

    @ApiPropertyOptional({ example: 5, description: 'Show products with stock less than or equal to this value' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxStock?: number;
}
