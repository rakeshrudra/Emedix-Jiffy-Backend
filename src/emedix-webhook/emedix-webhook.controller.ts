import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { EmedixWebhookService } from './emedix-webhook.service';
import { ProductDto } from '../products/dto/product.dto';
import { ProductStockDto } from '../products/dto/product-stock.dto';
import { InvoiceUploadDto } from '../invoices/dto/invoice.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('emedix-webhook')
@ApiHeader({ name: 'x-api-key', description: 'API key for authentication', required: true })
@UseGuards(ApiKeyGuard)
@Controller('api/emedix-webhook')
export class EmedixWebhookController {
    constructor(private readonly webhookService: EmedixWebhookService) {}

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

    @Get('orders/pending')
    @ApiOperation({
        summary: 'Fetch pending orders (Swil ERP poll endpoint)',
        description: 'Returns all PENDING orders for the store. Status remains PENDING until invoice is received.',
    })
    @ApiQuery({ name: 'store_id', required: true, description: 'Store ERP code' })
    @ApiResponse({ status: 200, description: 'Pending orders returned' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    getPendingOrders(@Query('store_id') store_id: string) {
        return this.webhookService.handlePendingOrders(store_id);
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
}
