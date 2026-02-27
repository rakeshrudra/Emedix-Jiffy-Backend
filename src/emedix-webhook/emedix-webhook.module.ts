import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmedixWebhookController } from './emedix-webhook.controller.js';
import { EmedixWebhookService } from './emedix-webhook.service.js';
import { Product } from './entities/product.entity.js';
import { Invoice } from './entities/invoice.entity.js';
import { InvoiceItem } from './entities/invoice-item.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Invoice, InvoiceItem])],
    controllers: [EmedixWebhookController],
    providers: [EmedixWebhookService],
    exports: [EmedixWebhookService],
})
export class EmedixWebhookModule { }
