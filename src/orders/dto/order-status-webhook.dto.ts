import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OrderStatusWebhookDto {
    @ApiProperty({ example: 'EJ-20260530-0001', description: 'Our order number' })
    @IsNotEmpty()
    @IsString()
    order_no: string;

    @ApiProperty({ example: 'SW-12345', required: false, description: 'Swil ERP internal order ID' })
    @IsOptional()
    @IsString()
    erp_order_id?: string;

    @ApiProperty({
        example: 'CONFIRMED',
        description: 'New order status: CONFIRMED | PACKED | DISPATCHED | DELIVERED | CANCELLED | FAILED',
    })
    @IsNotEmpty()
    @IsString()
    status: string;

    @ApiProperty({ example: 'https://erp.swil.in/invoices/INV10045.pdf', required: false })
    @IsOptional()
    @IsString()
    invoice_url?: string;

    @ApiProperty({ example: 'INV10045', required: false })
    @IsOptional()
    @IsString()
    invoice_number?: string;

    @ApiProperty({ example: 'Order packed and ready for dispatch', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
