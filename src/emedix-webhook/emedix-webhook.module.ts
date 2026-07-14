import { Module } from '@nestjs/common';
import { EmedixWebhookController } from './emedix-webhook.controller';
import { EmedixWebhookService } from './emedix-webhook.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        InvoicesModule,
        ProductsModule,
        OrdersModule,
    ],
    controllers: [EmedixWebhookController],
    providers: [EmedixWebhookService],
    exports: [EmedixWebhookService],
})
export class EmedixWebhookModule {}
