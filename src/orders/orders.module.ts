import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { OrderDeliveryAddress } from './entities/order-delivery-address.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InvoicesModule } from '../invoices/invoices.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';
import { CartModule } from '../cart/cart.module';
import { AddressesModule } from '../addresses/addresses.module';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog, OrderDeliveryAddress]),
        JwtModule.register({}),
        InvoicesModule,
        ProductsModule,
        StoresModule,
        CartModule,
        AddressesModule,
        UsersModule,
        AdminModule,
        NotificationsModule,
    ],
    controllers: [OrdersController, AdminOrdersController],
    providers: [OrdersService, OrdersGateway, JwtAuthGuard],
    exports: [OrdersService],
})
export class OrdersModule { }
