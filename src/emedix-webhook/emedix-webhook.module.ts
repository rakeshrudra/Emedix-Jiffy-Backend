import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmedixWebhookController } from './emedix-webhook.controller';
import { EmedixWebhookService } from './emedix-webhook.service';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Invoice, InvoiceItem])],
    controllers: [EmedixWebhookController],
    providers: [EmedixWebhookService],
    exports: [EmedixWebhookService],
})
export class EmedixWebhookModule { }
