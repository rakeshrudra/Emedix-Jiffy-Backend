import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { EmedixWebhookService } from './emedix-webhook.service';
import { ProductDto } from './dto/product.dto';
import { ProductStockDto } from './dto/product-stock.dto';
import { InvoiceUploadDto } from './dto/invoice.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { OrderStatusWebhookDto } from '../orders/dto/order-status-webhook.dto';

@ApiTags('emedix-webhook')
@ApiHeader({ name: 'x-api-key', description: 'API key for authentication', required: true })
@UseGuards(ApiKeyGuard)
@Controller('api/emedix-webhook')
export class EmedixWebhookController {
    constructor(private readonly webhookService: EmedixWebhookService) { }

    @Post('product')
    @ApiOperation({ summary: 'Add or update products from ERP' })
    @ApiBody({ type: ProductDto, isArray: true })
    @ApiResponse({ status: 201, description: 'Products upserted successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    handleProduct(@Body() data: ProductDto | ProductDto[]) {
        return this.webhookService.handleProduct(data);
    }

    @Post('product-stock')
    @ApiOperation({ summary: 'Update product stock from ERP' })
    @ApiBody({ type: ProductStockDto, isArray: true })
    @ApiResponse({ status: 201, description: 'Product stock updated successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    handleProductStock(@Body() data: ProductStockDto | ProductStockDto[]) {
        return this.webhookService.handleProductStock(data);
    }

    @Post('invoice')
    @ApiOperation({ summary: 'Upload invoices from ERP' })
    @ApiBody({ type: InvoiceUploadDto })
    @ApiResponse({ status: 201, description: 'Invoices upserted successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    handleInvoice(@Body() data: InvoiceUploadDto) {
        return this.webhookService.handleInvoice(data.result);
    }

    /**
     * POST /api/emedix-webhook/order-status
     * Swil ERP calls this endpoint to push real-time order status updates.
     * Secured with API key — ERP must pass x-api-key header.
     */
    @Post('order-status')
    @ApiOperation({ summary: 'Receive order status updates from ERP (CONFIRMED / PACKED / DISPATCHED / DELIVERED / CANCELLED)' })
    @ApiBody({ type: OrderStatusWebhookDto })
    @ApiResponse({ status: 201, description: 'Order status updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid status transition or validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    handleOrderStatus(@Body() dto: OrderStatusWebhookDto) {
        return this.webhookService.handleOrderStatus(dto);
    }
}
