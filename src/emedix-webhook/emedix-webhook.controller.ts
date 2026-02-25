import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { EmedixWebhookService } from './emedix-webhook.service.js';
import { ProductStockDto } from './dto/product-stock.dto.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';

@ApiTags('emedix-webhook')
@ApiHeader({ name: 'x-api-key', description: 'API key for authentication', required: true })
@UseGuards(ApiKeyGuard)
@Controller('emedix-webhook')
export class EmedixWebhookController {
    constructor(private readonly webhookService: EmedixWebhookService) { }

    @Post('product-stock')
    @ApiOperation({ summary: 'Receive product stock data from Swil ERP' })
    @ApiBody({ type: ProductStockDto, isArray: true })
    @ApiResponse({ status: 201, description: 'Product stock data upserted successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    handleProductStock(@Body() data: ProductStockDto | ProductStockDto[]) {
        return this.webhookService.handleProductStock(data);
    }
}
