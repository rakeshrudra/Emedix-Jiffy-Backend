import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import {
  CartStoreQueryDto,
  OptionalCartStoreQueryDto,
} from './dto/cart-store-query.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /api/cart
   * Returns carts, or one cart when store_id is supplied.
   */
  @Get()
  @ApiOperation({ summary: 'Get carts, or one cart when store_id is supplied' })
  @ApiQuery({
    name: 'store_id',
    required: false,
    description: 'Store-specific cart to return',
  })
  @ApiResponse({ status: 200, description: 'Cart data returned' })
  async getCart(@Req() req: any, @Query() query: OptionalCartStoreQueryDto) {
    return this.cartService.getCart(this.getUserId(req), query.store_id);
  }

  /**
   * POST /api/cart/items
   * Adds an item to the cart (increments quantity if already present).
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add item to cart (increments quantity if already present)',
  })
  @ApiResponse({ status: 200, description: 'Item added' })
  @ApiResponse({
    status: 400,
    description: 'Out of stock, unavailable, or store mismatch',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(@Req() req: any, @Body() dto: AddItemDto) {
    return this.cartService.addItem(this.getUserId(req), dto);
  }

  /**
   * PATCH /api/cart/items/:productCode
   * Updates item quantity (0 removes the item).
   */
  @Patch('items/:productCode')
  @ApiOperation({ summary: 'Update item quantity (0 removes the item)' })
  @ApiParam({ name: 'productCode', description: 'ERP product code' })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'Store cart that owns the item',
  })
  @ApiResponse({ status: 200, description: 'Quantity updated' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async updateItem(
    @Req() req: any,
    @Param('productCode') productCode: string,
    @Body() dto: UpdateItemDto,
    @Query() query: CartStoreQueryDto,
  ) {
    return this.cartService.updateItem(
      this.getUserId(req),
      productCode,
      dto,
      query.store_id,
    );
  }

  /**
   * DELETE /api/cart/items/:productCode
   * Removes a single item from the cart.
   */
  @Delete('items/:productCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a single item from cart' })
  @ApiParam({ name: 'productCode', description: 'ERP product code' })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'Store cart that owns the item',
  })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async removeItem(
    @Req() req: any,
    @Param('productCode') productCode: string,
    @Query() query: CartStoreQueryDto,
  ) {
    return this.cartService.removeItem(
      this.getUserId(req),
      productCode,
      query.store_id,
    );
  }

  /**
   * DELETE /api/cart
   * Clears a store cart.
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear a store cart',
  })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'Store-specific cart to clear',
  })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Req() req: any, @Query() query: CartStoreQueryDto) {
    return this.cartService.clearCart(this.getUserId(req), query.store_id);
  }

  /**
   * POST /api/cart/validate
   * Pre-checkout validation — checks stock and price changes.
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pre-checkout validation — checks stock and price changes',
    description:
      'Call before showing order confirmation. Location/reachability handled by frontend via GET /api/stores/reachable.',
  })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'Store-specific cart to validate',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result with per-item issues',
  })
  @ApiResponse({ status: 400, description: 'Cart is empty' })
  async validateCart(@Req() req: any, @Query() query: CartStoreQueryDto) {
    return this.cartService.validateCart(this.getUserId(req), query.store_id);
  }

  private getUserId(req: any): string {
    return req.user?.sub ?? (req.headers['x-user-id'] as string);
  }
}
