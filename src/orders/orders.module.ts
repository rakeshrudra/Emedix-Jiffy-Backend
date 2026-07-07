import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InvoicesModule } from '../invoices/invoices.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';
import { CartModule } from '../cart/cart.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog]),
        JwtModule.register({}),
        InvoicesModule,
        ProductsModule,
        StoresModule,
        CartModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService, JwtAuthGuard],
    exports: [OrdersService],
})
export class OrdersModule { }
