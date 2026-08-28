import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProductSearchQueryDto {
    @ApiProperty({ example: 'paracetamol', description: 'Search text' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiProperty({ example: '001', description: 'Store ID' })
    @IsNotEmpty()
    @IsString()
    store_id: string;
}
