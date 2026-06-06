import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Invoice } from '../emedix-webhook/entities/invoice.entity';
import { InvoiceItem } from '../emedix-webhook/entities/invoice-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog, Invoice, InvoiceItem]),
        JwtModule.register({}),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, JwtAuthGuard],
    exports: [OrdersService],
})
export class OrdersModule {}
