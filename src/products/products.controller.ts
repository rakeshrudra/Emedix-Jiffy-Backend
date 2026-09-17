import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';
import { AdminProductInventoryDto } from './dto/admin-product-inventory.dto';
import { AdminProductInventoryQueryDto } from './dto/admin-product-inventory-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../admin/enums/admin-role.enum';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
   * GET /api/products/search?q=paracetamol&store_id=001
   * Searches in-stock, enabled products by name, code, company, or composition.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Product search results' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async searchProducts(@Query() dto: ProductSearchQueryDto) {
    const products = await this.productsService.searchProducts(dto);
    return {
      success: true,
      data: products,
    };
  }

  /**
   * GET /api/products/code/:code?store_id=001
   * Returns a single product by its product code within a store.
   */
  @Get('code/:code')
  @ApiOperation({ summary: 'Get a single product by its product code' })
  @ApiParam({ name: 'code', description: 'Product code (e.g. MED10001)' })
  @ApiQuery({ name: 'store_id', required: true, description: 'Store ID the product belongs to' })
  @ApiResponse({ status: 200, description: 'Product detail' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductByCode(
    @Param('code') code: string,
    @Query('store_id') store_id: string,
  ) {
    const product = await this.productsService.findByCode(store_id, code);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return {
      success: true,
      data: product,
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

@ApiTags('Admin Products')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('api/admin')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/admin/products?page=1&limit=50&q=paracetamol
   * Lists every product for the logged-in admin's store, including zero stock.
   * Optional `q` searches by product name, code, company, or composition.
   */
  @Get('products')
  @ApiOperation({ summary: "List the logged-in admin store's full product inventory" })
  @ApiQuery({ name: 'q', required: false, description: 'Search by product name, code, company, or composition' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page, max 100', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Paginated store inventory returned',
    type: AdminProductInventoryDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listAdminProducts(
    @Request() req: any,
    @Query() query: AdminProductInventoryQueryDto,
  ) {
    const result = await this.productsService.listAdminInventory(
      req.admin.store_id,
      query,
    );

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
   * POST /api/admin/upload-inventory
   * Replaces the admin's store's entire product catalog with the uploaded
   * .xls file. Validates the whole file before writing anything — either
   * every row is accepted and the swap happens atomically, or nothing changes.
   */
  @Post('upload-inventory')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: "Replace the store's inventory from an .xls file" })
  @ApiResponse({ status: 201, description: 'Inventory replaced' })
  @ApiResponse({ status: 400, description: 'File validation failed — no changes made' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadInventory(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Attach it as "file".');
    }

    const result = await this.productsService.uploadInventory(
      req.admin.store_id,
      file.buffer,
    );

    return { success: true, data: result };
  }

  /**
   * POST /api/admin/upload-inventory-swil
   * Replaces the admin's store's entire product catalog with the uploaded
   * SWIL ERP .xls file. Validates the whole file before writing anything —
   * either every row is accepted and the swap happens atomically, or nothing changes.
   */
  @Post('upload-inventory-swil')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: "Replace the store's inventory from a SWIL ERP .xls file" })
  @ApiResponse({ status: 201, description: 'Inventory replaced' })
  @ApiResponse({ status: 400, description: 'File validation failed — no changes made' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadInventorySwil(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Attach it as "file".');
    }

    const result = await this.productsService.uploadInventorySwil(
      req.admin.store_id,
      file.buffer,
    );

    return { success: true, data: result };
  }
}

@ApiTags('Super Admin Products')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Roles(AdminRole.EMEDIX_SUPERADMIN, AdminRole.EMEDIX_ADMIN)
@Controller('api/admin/super/products')
export class SuperAdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/admin/super/products/:store_id?page=1&limit=50&q=paracetamol
   * Lists the full product inventory for any store, chosen by store_id.
   * Restricted to Super Admin and Emedix Admin.
   */
  @Get(':store_id')
  @ApiOperation({ summary: "List a chosen store's full product inventory (Super Admin)" })
  @ApiParam({ name: 'store_id', description: 'ERP store ID' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by product name, code, company, or composition' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page, max 100', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Paginated store inventory returned',
    type: AdminProductInventoryDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Super Admin access required' })
  async listStoreProducts(
    @Param('store_id') store_id: string,
    @Query() query: AdminProductInventoryQueryDto,
  ) {
    const result = await this.productsService.listAdminInventory(
      store_id,
      query,
    );

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
}
