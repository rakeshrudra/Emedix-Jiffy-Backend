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
  Req,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  @ApiOperation({ summary: 'Get active cart with items and subtotal' })
  @ApiResponse({ status: 200, description: 'Cart returned' })
  async getCart(@Req() req: any) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add item to cart (increments quantity if already present)' })
  @ApiResponse({ status: 200, description: 'Item added' })
  @ApiResponse({ status: 400, description: 'Out of stock, unavailable, or store mismatch' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(@Req() req: any, @Body() dto: AddItemDto) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:productCode')
  @ApiOperation({ summary: 'Update item quantity (0 removes the item)' })
  @ApiParam({ name: 'productCode', description: 'ERP product code' })
  @ApiResponse({ status: 200, description: 'Quantity updated' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async updateItem(
    @Req() req: any,
    @Param('productCode') productCode: string,
    @Body() dto: UpdateItemDto,
  ) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.updateItem(userId, productCode, dto);
  }

  @Delete('items/:productCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a single item from cart' })
  @ApiParam({ name: 'productCode', description: 'ERP product code' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async removeItem(@Req() req: any, @Param('productCode') productCode: string) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.removeItem(userId, productCode);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Req() req: any) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.clearCart(userId);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pre-checkout validation — checks stock and price changes',
    description: 'Call before showing order confirmation. Location/reachability handled by frontend via GET /api/stores/reachable.',
  })
  @ApiResponse({ status: 200, description: 'Validation result with per-item issues' })
  @ApiResponse({ status: 400, description: 'Cart is empty' })
  async validateCart(@Req() req: any) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.cartService.validateCart(userId);
  }
}
