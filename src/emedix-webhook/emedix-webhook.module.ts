import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmedixWebhookController } from './emedix-webhook.controller';
import { EmedixWebhookService } from './emedix-webhook.service';
import { Product } from '../products/entities/product.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        OrdersModule,
    ],
    controllers: [EmedixWebhookController],
    providers: [EmedixWebhookService],
    exports: [EmedixWebhookService],
})
export class EmedixWebhookModule {}
