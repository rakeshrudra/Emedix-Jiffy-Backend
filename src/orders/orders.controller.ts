import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { SafeAuthenticatedAdmin } from '../admin-auth/admin-auth.service';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { UpdateAdminOrderItemsDto } from './dto/update-admin-order-items.dto';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto';
import { OrderStatus } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
    const order = await this.ordersService.createOrder(
      req.user?.sub ?? (req.headers['x-user-id'] as string),
      dto,
    );
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
  @ApiOperation({
    summary: 'Get order history for authenticated user (paginated)',
  })
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
    const result = await this.ordersService.getOrdersByUser(
      req.user?.sub ?? (req.headers['x-user-id'] as string),
      parsedPage,
      parsedLimit,
    );
    return {
      success: true,
      message: 'Orders fetched successfully',
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: parsedLimit,
        pages: result.pages,
      },
    };
  }

  /**
   * GET /api/orders/:id
   * Returns a single order with items and status timeline.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order detail returned' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.getOrderById(
      id,
      req.user?.sub ?? (req.headers['x-user-id'] as string),
    );
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
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Invoice returned' })
  @ApiResponse({
    status: 403,
    description: 'Access denied — order does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found or invoice not yet generated',
  })
  async getOrderInvoice(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const invoice = await this.ordersService.getOrderInvoice(
      id,
      req.user?.sub ?? (req.headers['x-user-id'] as string),
    );
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
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel in current state' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ) {
    const order = await this.ordersService.cancelOrder(
      id,
      req.user?.sub ?? (req.headers['x-user-id'] as string),
      dto,
    );
    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }
}

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('api/admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin orders for the authenticated admin store',
    description:
      'Returns all orders for the logged-in admin store. Use the optional status query to filter by order status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description:
      'Optional status filter. Leave blank to return all orders for the logged-in admin store.',
  })
  @ApiResponse({ status: 200, description: 'Admin order list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoreOrders(
    @CurrentAdmin() admin: SafeAuthenticatedAdmin,
    @Query() query: AdminOrdersQueryDto,
  ) {
    return this.ordersService.getAdminOrders(admin.store_id, query.status);
  }

  @Get(':orderId/items')
  @ApiOperation({
    summary: 'Get checklist items for an admin order',
    description:
      'Returns order items for the given order only when it belongs to the authenticated admin store.',
  })
  @ApiParam({ name: 'orderId', type: Number, example: 6 })
  @ApiResponse({
    status: 200,
    description: 'Order items returned',
    schema: {
      example: {
        success: true,
        message: 'Order items fetched successfully',
        data: {
          order_id: 6,
          order_no: 'EJ-20260716-0006',
          status: 'PENDING',
          items: [
            {
              id: 12,
              product_code: 'MED10002',
              product_name: 'Amoxicillin 250mg Capsule',
              product_company: 'Sun Pharma',
              product_type: 'Capsule',
              packaging_of_medicines: '10 Capsules per Strip',
              product_composition: 'Amoxicillin 250mg',
              ordered_quantity: 3,
              product_price: '75.00',
              product_discount_price: '70.00',
              total: '210.00',
              hsn_code: '3004',
              isAvailable: false,
              confirmedQuantity: 0,
              created_at: '2026-07-16T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async getOrderItems(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentAdmin() admin: SafeAuthenticatedAdmin,
  ) {
    const data = await this.ordersService.getAdminOrderItems(
      orderId,
      admin.store_id,
    );

    return {
      success: true,
      message: 'Order items fetched successfully',
      data,
    };
  }

  @Patch(':orderId/items')
  @ApiOperation({
    summary: 'Update the full item availability checklist for a pending order',
    description:
      'Uses the authenticated admin store. The request must include every item in the order.',
  })
  @ApiParam({ name: 'orderId', type: Number, example: 1 })
  @ApiBody({ type: UpdateAdminOrderItemsDto })
  @ApiResponse({
    status: 200,
    description: 'Order items updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Order items updated successfully',
        data: {
          order_id: 1,
          items: [
            {
              id: 1,
              ordered_quantity: 3,
              isAvailable: true,
              confirmedQuantity: 3,
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or order is not editable',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async updateItems(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateAdminOrderItemsDto,
    @CurrentAdmin() admin: SafeAuthenticatedAdmin,
  ) {
    const data = await this.ordersService.updateAdminOrderItems(
      orderId,
      admin.store_id,
      dto,
    );

    return {
      success: true,
      message: 'Order items updated successfully',
      data,
    };
  }

  @Patch(':orderId/status')
  @ApiOperation({
    summary: 'Update order status through the Phase 1 pickup workflow',
    description: `${OrderStatus.PENDING} -> ${OrderStatus.CONFIRMED} -> ${OrderStatus.READY_FOR_PICKUP} -> ${OrderStatus.PICKED_UP}`,
  })
  @ApiParam({ name: 'orderId', type: Number, example: 1 })
  @ApiBody({ type: UpdateAdminOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Order status updated successfully',
        data: {
          order: {
            id: 1,
            order_no: 'EJ-20260715-0001',
            previous_status: 'PENDING',
            status: 'CONFIRMED',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid transition or incomplete checklist',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async updateStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateAdminOrderStatusDto,
    @CurrentAdmin() admin: SafeAuthenticatedAdmin,
  ) {
    const data = await this.ordersService.updateAdminOrderStatus(
      orderId,
      admin.store_id,
      dto,
      admin.id,
    );

    return {
      success: true,
      message: 'Order status updated successfully',
      data,
    };
  }
}
