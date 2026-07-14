import {
  BadRequestException,
  Controller,
  Get,
  ParseFloatPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MapsService } from './maps.service';

@ApiTags('Maps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) { }

  /**
   * GET /api/maps/autocomplete?input=Rajpur Road
   * Returns Place Autocomplete suggestions (India only).
   * Frontend uses the returned place_id to call /place-details.
   */
  @Get('autocomplete')
  @ApiOperation({ summary: 'Get address autocomplete suggestions (India)' })
  @ApiQuery({ name: 'input', required: true, example: 'Rajpur Road, Dehradun' })
  @ApiResponse({ status: 200, description: 'List of place suggestions' })
  @ApiResponse({ status: 400, description: 'Input too short' })
  async autocomplete(@Query('input') input: string) {
    if (!input || input.trim().length < 2) {
      throw new BadRequestException('Input must be at least 2 characters');
    }
    const results = await this.mapsService.autocomplete(input.trim());
    return { success: true, data: results };
  }

  /**
   * GET /api/maps/place-details?place_id=ChIJ...
   * Resolves a Google Place ID to a full canonical address object + lat/lng.
   * Call this after the user selects an autocomplete suggestion.
   */
  @Get('place-details')
  @ApiOperation({ summary: 'Resolve a Place ID to a full address + coordinates' })
  @ApiQuery({ name: 'place_id', required: true, example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
  @ApiResponse({ status: 200, description: 'Full place details resolved' })
  @ApiResponse({ status: 400, description: 'place_id is required' })
  async placeDetails(@Query('place_id') placeId: string) {
    if (!placeId?.trim()) {
      throw new BadRequestException('place_id is required');
    }
    const result = await this.mapsService.placeDetails(placeId.trim());
    return { success: true, data: result };
  }

  /**
   * GET /api/maps/geocode?q=Rajpur+Road+Dehradun
   * Forward-geocodes a typed address string and returns a canonical address preview.
   * Does NOT save. Frontend shows confirm screen; user then calls POST /api/address to save.
   */
  @Get('geocode')
  @ApiOperation({ summary: 'Forward geocode a typed address query (preview, does not save)' })
  @ApiQuery({ name: 'q', required: true, example: 'Rajpur Road, Dehradun' })
  @ApiResponse({ status: 200, description: 'Address preview resolved' })
  @ApiResponse({ status: 400, description: 'Query too short' })
  async geocode(@Query('q') q: string) {
    if (!q || q.trim().length < 3) {
      throw new BadRequestException('Query must be at least 3 characters');
    }
    const result = await this.mapsService.forwardGeocode(q.trim());
    return { success: true, data: result };
  }

  /**
   * GET /api/maps/reverse-geocode?lat=30.316&lng=78.032
   * Converts GPS coordinates to a structured address preview.
   * Does NOT save. Frontend shows the result and user confirms.
   */
  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode GPS coordinates to a structured address' })
  @ApiQuery({ name: 'lat', required: true, example: 30.3165 })
  @ApiQuery({ name: 'lng', required: true, example: 78.0322 })
  @ApiResponse({ status: 200, description: 'Address resolved from coordinates' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async reverseGeocode(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    const result = await this.mapsService.reverseGeocode(lat, lng);
    return { success: true, data: result };
  }
}
