import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Orders')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
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
        const order = await this.ordersService.createOrder(req.user?.sub ?? (req.headers['x-user-id'] as string), dto);
        return {
            success: true,
            message: 'Order placed successfully',
            data: order,
        };
    }

    /**
     * GET /api/orders
     * Returns paginated order history for the authenticated user.
     */
    @Get()
    @ApiOperation({ summary: 'Get order history for authenticated user (paginated)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Order list returned' })
    async getMyOrders(
        @Request() req,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const result = await this.ordersService.getOrdersByUser(req.user?.sub ?? (req.headers['x-user-id'] as string), parsedPage, parsedLimit);
        return {
            success: true,
            message: 'Orders fetched successfully',
            data: result.data,
            meta: { total: result.total, page: result.page, limit: parsedLimit, pages: result.pages },
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
        const order = await this.ordersService.getOrderById(id, req.user?.sub ?? (req.headers['x-user-id'] as string));
        return {
            success: true,
            message: 'Order fetched successfully',
            data: order,
        };
    }

    /**
     * GET /api/orders/:id/invoice
     * Returns the invoice for a specific order.
     */
    @Get(':id/invoice')
    @ApiOperation({ summary: 'Get invoice for a specific order' })
    @ApiParam({ name: 'id', description: 'Order UUID' })
    @ApiResponse({ status: 200, description: 'Invoice returned' })
    @ApiResponse({ status: 403, description: 'Access denied — order does not belong to user' })
    @ApiResponse({ status: 404, description: 'Order not found or invoice not yet generated' })
    async getOrderInvoice(@Request() req, @Param('id') id: string) {
        const invoice = await this.ordersService.getOrderInvoice(id, req.user?.sub ?? (req.headers['x-user-id'] as string));
        return {
            success: true,
            message: 'Invoice fetched successfully',
            data: invoice,
        };
    }

    /**
     * PATCH /api/orders/:id/cancel
     * Cancels an order only in PENDING state.
     */
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel an order (only in PENDING state)' })
    @ApiParam({ name: 'id', description: 'Order UUID' })
    @ApiResponse({ status: 200, description: 'Order cancelled' })
    @ApiResponse({ status: 400, description: 'Cannot cancel in current state' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async cancelOrder(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: CancelOrderDto,
    ) {
        const order = await this.ordersService.cancelOrder(id, req.user?.sub ?? (req.headers['x-user-id'] as string), dto);
        return {
            success: true,
            message: 'Order cancelled successfully',
            data: order,
        };
    }
}
