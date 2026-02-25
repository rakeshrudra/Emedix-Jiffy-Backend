import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmedixWebhookController } from './emedix-webhook.controller.js';
import { EmedixWebhookService } from './emedix-webhook.service.js';
import { ProductStock } from './entities/product-stock.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([ProductStock])],
    controllers: [EmedixWebhookController],
    providers: [EmedixWebhookService],
    exports: [EmedixWebhookService],
})
export class EmedixWebhookModule { }
