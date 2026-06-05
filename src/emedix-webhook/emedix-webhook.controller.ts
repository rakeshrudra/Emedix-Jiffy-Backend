import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { EmedixWebhookService } from './emedix-webhook.service.js';
import { ProductDto } from './dto/product.dto.js';
import { ProductStockDto } from './dto/product-stock.dto.js';
import { InvoiceUploadDto } from './dto/invoice.dto.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';

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
}
