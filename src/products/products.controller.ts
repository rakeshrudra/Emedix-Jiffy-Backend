import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Products')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  /**
   * GET /api/products?store_id=001&q=paracetamol&page=1&limit=20
   * Lists in-stock, enabled products for a store.
   * Optional `q` filters by product name (LIKE search).
   */
  @Get()
  @ApiOperation({ summary: 'List products for a store (with optional name search)' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async listProducts(@Query() dto: SearchProductsDto) {
    const result = await this.productsService.listProducts(dto);
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * GET /api/products/:id
   * Returns a single product by its numeric ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiParam({ name: 'id', description: 'Product numeric ID' })
  @ApiResponse({ status: 200, description: 'Product detail' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.getProduct(id);
    return {
      success: true,
      data: product,
    };
  }
}
