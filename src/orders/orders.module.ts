import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SwilErpService } from './swil-erp.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog]),
        JwtModule.register({}),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, SwilErpService],
    exports: [OrdersService],
})
export class OrdersModule {}
