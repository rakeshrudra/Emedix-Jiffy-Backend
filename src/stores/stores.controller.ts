import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFloatPipe,
  ParseUUIDPipe,
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
import { CreateStoreDto } from './dto/create-store.dto';
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
   * Returns the nearest active store covering the user's location.
   * is_open flag indicates whether the store is currently open (IST).
   */
  @Get('nearest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get nearest active store for a location' })
  @ApiQuery({ name: 'lat', required: true, example: 30.3165 })
  @ApiQuery({ name: 'lng', required: true, example: 78.0322 })
  @ApiResponse({ status: 200, description: 'Nearest store returned (null if none in range)' })
  async findNearest(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates');
    }
    return this.storesService.findNearest(lat, lng);
  }

  /**
   * GET /api/stores/reachable?lat=&lng=
   * Returns all active stores whose delivery radius covers the location.
   * Ordered by distance ascending. Used for manual store switching.
   */
  @Get('reachable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stores reachable from a location (ordered by distance)' })
  @ApiQuery({ name: 'lat', required: true, example: 30.3165 })
  @ApiQuery({ name: 'lng', required: true, example: 78.0322 })
  @ApiResponse({ status: 200, description: 'List of reachable stores' })
  async findReachable(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates');
    }
    return this.storesService.findReachable(lat, lng);
  }

  /**
   * GET /api/stores/:id
   * Returns a single store by UUID.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single store by UUID' })
  @ApiParam({ name: 'id', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.findOne(id);
  }
}
