import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class AdminOrdersQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description:
      'Optional order status filter. Leave blank to return all orders for the logged-in admin store.',
    example: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
