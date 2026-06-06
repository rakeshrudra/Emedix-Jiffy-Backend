import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { InvoiceUploadDto } from './dto/invoice.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('emedix-webhook')
@ApiHeader({ name: 'x-api-key', description: 'API key for authentication', required: true })
@UseGuards(ApiKeyGuard)
@Controller('api/emedix-webhook')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    @Post('invoice')
    @ApiOperation({ summary: 'Upload invoices from ERP' })
    @ApiBody({ type: InvoiceUploadDto })
    @ApiResponse({ status: 201, description: 'Invoices upserted successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
    handleInvoice(@Body() data: InvoiceUploadDto) {
        return this.invoicesService.handleInvoice(data.result);
    }
}
