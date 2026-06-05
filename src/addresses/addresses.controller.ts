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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { GeocodeDto } from './dto/geocode.dto';
import { SaveAddressDto } from './dto/save-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/address')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) { }

  /**
   * POST /api/address/geocode
   * Forward-geocodes a typed query and returns a preview.
   * Does NOT save. Used to populate the address form before user confirms.
   */
  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Geocode a typed address query (preview only, does not save)',
    description:
      'Accepts a free-text address query, calls Google Maps forward geocoding, and returns the resolved address for the user to confirm. Call POST /api/address to save after confirmation.',
  })
  @ApiResponse({ status: 200, description: 'Address preview resolved successfully' })
  @ApiResponse({ status: 500, description: 'Address not found or geocoding failed' })
  async geocode(@Body() dto: GeocodeDto) {
    return this.addressesService.geocodeQuery(dto);
  }

  /**
   * POST /api/address
   * Saves a confirmed address to the user's address book.
   * GPS addresses: frontend resolves coords via expo-location, sends all fields here.
   * Manual addresses: user confirms the geocode preview, then calls this to save.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a confirmed address (GPS or manual)',
    description:
      'Persists the address after user confirmation. Max 5 addresses per user. First address is auto-set as default.',
  })
  @ApiResponse({ status: 201, description: 'Address saved successfully' })
  @ApiResponse({ status: 400, description: 'Max address limit reached or duplicate address' })
  async saveAddress(@Req() req: any, @Body() dto: SaveAddressDto) {
    return this.addressesService.saveAddress(req.user.sub, dto);
  }

  /**
   * GET /api/address
   * Returns all saved addresses for the authenticated user.
   * Default address is always returned first.
   */
  @Get()
  @ApiOperation({ summary: 'Get all saved addresses for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Address list returned' })
  async getMyAddresses(@Req() req: any) {
    return this.addressesService.getUserAddresses(req.user.sub);
  }

  /**
   * PATCH /api/address/:id
   * Update label (Home / Work / Other) or set as default delivery address.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update address label or set as default' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(req.user.sub, id, dto);
  }

  /**
   * DELETE /api/address/:id
   * Deletes a saved address. If it was the default, the next most recent is promoted.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async removeAddress(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.removeAddress(req.user.sub, id);
  }
}
