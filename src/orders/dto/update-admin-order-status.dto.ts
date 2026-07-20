import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateAdminOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    description:
      'Allowed Phase 1 transitions: PENDING -> CONFIRMED -> READY_FOR_PICKUP -> PICKED_UP',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
