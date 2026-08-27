import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFloatPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SsoAuthGuard } from '../common/guards/sso-auth.guard';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../admin/enums/admin-role.enum';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreAdminDto } from './dto/update-store-admin.dto';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('api/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) { }

  /**
   * POST /api/stores
   * Adds a store to the database. Protected by API key (admin/ops only).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Add a new store (API key required)' })
  @ApiResponse({ status: 201, description: 'Store created' })
  @ApiResponse({ status: 409, description: 'Store with this ERP code already exists' })
  async create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  /**
   * GET /api/stores/nearest?lat=&lng=
   * Returns ALL active stores ordered by distance ascending (closest first).
   * No delivery-radius cutoff — called at app start before the user has
   * chosen pickup or delivery. Client shows the list and defaults to the
   * first (nearest) store; is_open flag indicates current opening status (IST).
   */
  @Get('nearest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active stores for a location, ordered by distance' })
  @ApiQuery({ name: 'lat', required: true, example: 30.3165 })
  @ApiQuery({ name: 'lng', required: true, example: 78.0322 })
  @ApiResponse({ status: 200, description: 'Stores ordered by distance ascending (empty if none active)' })
  async findNearest(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.storesService.findNearest(lat, lng);
  }

  /**
   * GET /api/stores/reachable?store_id=&lat=&lng=
   * Delivery-only check: can this store deliver to this address?
   * Called at cart checkout when fulfillment_type is DELIVERY, with the
   * chosen delivery address's coordinates. Not used for PICKUP.
   */
  @Get('reachable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check whether a store can deliver to a given address (delivery only)' })
  @ApiQuery({ name: 'store_id', required: true, example: '001' })
  @ApiQuery({ name: 'lat', required: true, example: 30.3165 })
  @ApiQuery({ name: 'lng', required: true, example: 78.0322 })
  @ApiResponse({ status: 200, description: 'reachable flag plus distance_km and delivery_radius_km' })
  async checkReachable(
    @Query('store_id') store_id: string,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.storesService.checkReachable(store_id, lat, lng);
  }

  /**
   * GET /api/stores/:id
   * Returns a single store by id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single store by ERP store ID' })
  @ApiParam({ name: 'id', description: 'ERP store ID' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }
}


@ApiTags('Admin Stores')
@ApiBearerAuth()
@UseGuards(SsoAuthGuard)
@Controller('api/admin/stores')
export class AdminStoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * GET /api/admin/stores
   * Returns store_id + emedix_name for all active stores.
   * Used by the Vitality signup flow to let a user pick their store.
   */
  @Get('')
  @ApiOperation({ summary: 'Get all active store emedix names' })
  @ApiResponse({ status: 200, description: 'Store names returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllNames() {
    return this.storesService.findAllEmedixNamesForAdmin();
  }
}

@ApiTags('Super Admin Stores')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Roles(AdminRole.EMEDIX_SUPERADMIN, AdminRole.EMEDIX_ADMIN)
@Controller('api/admin/super/stores')
export class SuperAdminStoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * GET /api/admin/super/stores
   * Returns all stores for the Super Admin table.
   */
  @Get()
  @ApiOperation({ summary: 'Get all stores for Super Admin' })
  @ApiResponse({ status: 200, description: 'All stores returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Super Admin access required' })
  async findAll() {
    return this.storesService.findAllForSuperAdmin();
  }

  /**
   * GET /api/admin/super/stores/:store_id
   * Returns complete details for one selected store.
   */
  @Get(':store_id')
  @ApiOperation({ summary: 'Get one store for Super Admin' })
  @ApiParam({ name: 'store_id', description: 'ERP store ID' })
  @ApiResponse({ status: 200, description: 'Store details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('store_id') store_id: string) {
    return this.storesService.findOneForSuperAdmin(store_id);
  }

  /**
   * PATCH /api/admin/super/stores/:store_id
   * Partially updates store management fields. The table status toggle can
   * call this endpoint with only is_active.
   */
  @Patch(':store_id')
  @ApiOperation({ summary: 'Update one store for Super Admin' })
  @ApiParam({ name: 'store_id', description: 'ERP store ID' })
  @ApiResponse({ status: 200, description: 'Store updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(
    @Param('store_id') store_id: string,
    @Body() dto: UpdateStoreAdminDto,
  ) {
    return this.storesService.updateForSuperAdmin(store_id, dto);
  }
}
