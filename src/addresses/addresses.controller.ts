import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { GetLocationDto } from './dto/get-location.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) { }

  /**
   * POST /api/address/get-location
   * Reverse-geocodes GPS coordinates and saves the resolved address.
   */
  @Post('get-location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get address from current GPS location',
    description: 'Accepts latitude & longitude, calls Google Maps reverse geocoding, and saves the resolved address for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Address successfully resolved and saved',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          formatted_address: 'MG Road, Hyderabad, Telangana, India',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          country: 'India',
          latitude: 17.385044,
          longitude: 78.486671,
          source: 'gps',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Unable to resolve address from location',
    schema: { example: { success: false, error: 'Unable to resolve address from location' } },
  })
  async getLocation(@Req() req: any, @Body() geoLocationDto: GetLocationDto,) {
    return this.addressesService.getLocation(req.user.sub, geoLocationDto);
  }

  /**
   * POST /api/address/add
   * Forward-geocodes a manually typed address and saves it.
   */
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add address manually',
    description: 'Accepts a typed address, calls Google Maps forward geocoding to obtain lat/lng, and saves the validated address for the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Address successfully added',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          formatted_address: '12 MG Road, Hyderabad, Telangana 500001, India',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          country: 'India',
          latitude: 17.38,
          longitude: 78.48,
          source: 'manual',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Address not found or geocoding failed',
    schema: { example: { success: false, error: 'Address not found. Please check the address and try again.' } },
  })
  async addAddress(@Req() req: any, @Body() addAddressDto: AddAddressDto) {
    return this.addressesService.addAddress(req.user.sub, addAddressDto);
  }

  /**
   * GET /api/address
   * Returns all saved addresses for the authenticated user.
   */
  @Get(':userId')
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiResponse({ status: 200, description: 'List of saved addresses' })
  async getMyAddresses(@Param('userId') userId: string) {
    const addresses = await this.addressesService.getUserAddresses(userId);
    return { success: true, data: addresses };
  }

  /**
   * DELETE /api/address/:id
   * Deletes a saved address (must belong to the requesting user).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address by ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 400, description: 'Address not found or does not belong to user' })
  async removeAddress(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.removeAddress(req.user.sub, id);
  }
}
