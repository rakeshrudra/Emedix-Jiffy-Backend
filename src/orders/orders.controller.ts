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
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../admin/enums/admin-role.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { UpdateAdminOrderItemsDto } from './dto/update-admin-order-items.dto';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderActor, OrderStatus } from './entities/order.entity';

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
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Order list returned' })
  async getMyOrders(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
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
  @ApiResponse({ status: 403, description: 'Access denied — order does not belong to user', })
  @ApiResponse({ status: 404, description: 'Order not found or invoice not yet generated', })
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
   * Cancels the user's own order (allowed until READY_FOR_PICKUP).
   */
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (user)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiBadRequestResponse({ description: 'Order cannot be cancelled in its current state' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ) {
    const user_id = req.user?.sub ?? (req.headers['x-user-id'] as string);
    const order = await this.ordersService.cancelOrder(
      id,
      OrderActor.USER,
      { user_id },
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
  constructor(private readonly ordersService: OrdersService) { }

  /**
   * GET /api/admin/orders
   * Returns paginated orders for the authenticated admin store (default limit 30).
   */
  @Get()
  @ApiOperation({
    summary: 'Get paginated admin orders for the authenticated admin store',
    description:
      'Returns paginated orders for the logged-in admin store (default limit 30). Use the optional status query to filter by order status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description:
      'Optional status filter. Leave blank to return all orders for the logged-in admin store.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Admin order list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoreOrders(
    @Request() req,
    @Query() query: AdminOrdersQueryDto,
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 30));
    return this.ordersService.getAdminOrders(
      req.user?.store_id,
      query.status,
      page,
      limit,
    );
  }

  /**
   * GET /api/admin/orders/:order_id/items
   * Returns checklist items for an order in the authenticated admin store.
   */
  @Get(':order_id/items')
  @ApiOperation({
    summary: 'Get checklist items for an admin order',
    description:
      'Returns order items for the given order only when it belongs to the authenticated admin store.',
  })
  @ApiParam({ name: 'order_id', type: Number, example: 6 })
  @ApiResponse({ status: 200, description: 'Order items returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async getOrderItems(
    @Param('order_id', ParseIntPipe) order_id: number,
    @Request() req,
  ) {
    const data = await this.ordersService.getAdminOrderItems(
      order_id,
      req.user?.store_id,
    );

    return {
      success: true,
      message: 'Order items fetched successfully',
      data,
    };
  }

  /**
   * PATCH /api/admin/orders/:order_id/items
   * Updates the full item availability checklist for a pending order.
   */
  @Patch(':order_id/items')
  @UseGuards(AdminRolesGuard)
  @Roles(AdminRole.STORE_OWNER, AdminRole.STORE_ADMIN, AdminRole.STORE_STAFF)
  @ApiOperation({
    summary: 'Update the full item availability checklist for a pending order',
    description:
      'Uses the authenticated admin store. The request must include every item in the order.',
  })
  @ApiParam({ name: 'order_id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAdminOrderItemsDto })
  @ApiResponse({ status: 200, description: 'Order items updated successfully' })
  @ApiBadRequestResponse({
    description: 'Validation failed or order is not editable',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async updateItems(
    @Param('order_id', ParseIntPipe) order_id: number,
    @Body() dto: UpdateAdminOrderItemsDto,
    @Request() req,
  ) {
    const data = await this.ordersService.updateAdminOrderItems(
      order_id,
      req.user?.store_id,
      dto,
    );

    return {
      success: true,
      message: 'Order items updated successfully',
      data,
    };
  }

  /**
   * PATCH /api/admin/orders/:order_id/status
   * Updates order status through the Phase 1 pickup workflow.
   */
  @Patch(':order_id/status')
  @UseGuards(AdminRolesGuard)
  @Roles(AdminRole.STORE_OWNER, AdminRole.STORE_ADMIN, AdminRole.STORE_STAFF)
  @ApiOperation({
    summary: 'Update order status through the Phase 1 pickup workflow',
    description: `${OrderStatus.PENDING} -> ${OrderStatus.CONFIRMED} -> ${OrderStatus.READY_FOR_PICKUP} -> ${OrderStatus.PICKED_UP}`,
  })
  @ApiParam({ name: 'order_id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAdminOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid transition or incomplete checklist',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async updateStatus(
    @Param('order_id', ParseIntPipe) order_id: number,
    @Body() dto: UpdateAdminOrderStatusDto,
    @Request() req,
  ) {
    const data = await this.ordersService.updateAdminOrderStatus(
      order_id,
      req.user?.store_id,
      dto,
      req.user?.sub,
    );

    return {
      success: true,
      message: 'Order status updated successfully',
      data,
    };
  }

  /**
   * PATCH /api/admin/orders/:order_id/cancel
   * Cancels an order for the authenticated admin store (allowed until READY_FOR_PICKUP).
   */
  @Patch(':order_id/cancel')
  @UseGuards(AdminRolesGuard)
  @Roles(AdminRole.STORE_OWNER, AdminRole.STORE_ADMIN, AdminRole.STORE_STAFF)
  @ApiOperation({ summary: 'Cancel an order (store)' })
  @ApiParam({ name: 'order_id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiBadRequestResponse({ description: 'Order cannot be cancelled in its current state' })
  @ApiUnauthorizedResponse({ description: 'Invalid admin access token' })
  @ApiNotFoundResponse({ description: 'Order not found or not accessible' })
  async cancelOrder(
    @Param('order_id', ParseIntPipe) order_id: number,
    @Body() dto: CancelOrderDto,
    @Request() req,
  ) {
    const order = await this.ordersService.cancelOrder(
      order_id,
      OrderActor.STORE,
      { store_id: req.user?.store_id },
      dto,
    );

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }
}

@ApiTags('Super Admin Orders')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Roles(AdminRole.EMEDIX_SUPERADMIN, AdminRole.EMEDIX_ADMIN)
@Controller('api/admin/super/orders')
export class SuperAdminAllOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /api/admin/super/orders
   * Returns paginated orders across all stores, optionally filtered by store
   * and status for the Super Admin dashboard.
   */
  @Get()
  @ApiOperation({
    summary: 'Get paginated orders across stores as Super Admin',
    description:
      'Returns paginated orders across all stores. Use optional store_id and status queries to filter the dashboard.',
  })
  @ApiQuery({ name: 'store_id', required: false, description: 'Optional ERP store ID', example: '001' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Optional status filter. Leave blank to return all statuses.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Super Admin order list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Super Admin access required' })
  async getOrders(@Query() query: AdminOrdersQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 30));

    return this.ordersService.getSuperAdminOrders(
      query.store_id,
      query.status,
      page,
      limit,
    );
  }
}
