import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { OrderDelivery } from './entities/order-delivery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderDelivery, Order])],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
