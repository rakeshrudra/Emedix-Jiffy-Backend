import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * POST /api/orders
     * Called immediately after payment success on the client.
     * Idempotency key prevents duplicate orders on network retry.
     */
    @Post()
    @ApiOperation({ summary: 'Create a new order after payment success' })
    @ApiResponse({ status: 201, description: 'Order created and pushed to ERP' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
        const order = await this.ordersService.createOrder(req.user.sub, dto);
        return {
            success: true,
            message: 'Order placed successfully',
            data: order,
        };
    }

    /**
     * GET /api/orders
     * Returns full order history for the authenticated user.
     */
    @Get()
    @ApiOperation({ summary: 'Get order history for authenticated user' })
    @ApiResponse({ status: 200, description: 'Order list returned' })
    async getMyOrders(@Request() req) {
        const orders = await this.ordersService.getOrdersByUser(req.user.sub);
        return {
            success: true,
            message: 'Orders fetched successfully',
            data: orders,
        };
    }

    /**
     * GET /api/orders/:id
     * Returns a single order with items and status timeline.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific order by ID' })
    @ApiParam({ name: 'id', description: 'Order UUID' })
    @ApiResponse({ status: 200, description: 'Order detail returned' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrderById(@Request() req, @Param('id') id: string) {
        const order = await this.ordersService.getOrderById(id, req.user.sub);
        return {
            success: true,
            message: 'Order fetched successfully',
            data: order,
        };
    }

    /**
     * PATCH /api/orders/:id/cancel
     * Cancels an order only in PENDING or CONFIRMED state.
     */
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel an order (only in PENDING or CONFIRMED state)' })
    @ApiParam({ name: 'id', description: 'Order UUID' })
    @ApiResponse({ status: 200, description: 'Order cancelled' })
    @ApiResponse({ status: 400, description: 'Cannot cancel in current state' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async cancelOrder(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: CancelOrderDto,
    ) {
        const order = await this.ordersService.cancelOrder(id, req.user.sub, dto);
        return {
            success: true,
            message: 'Order cancelled successfully',
            data: order,
        };
    }
}
