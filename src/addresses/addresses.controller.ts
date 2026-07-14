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
import { SaveAddressDto } from './dto/save-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/address')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) { }

  /**
   * POST /api/address
   * Saves a confirmed address to the user's address book.
   * Works for all flows: GPS (source: gps), manual geocode (source: manual), Places Autocomplete (source: places).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a confirmed address',
    description:
      'Persists the address after user confirmation. Max 5 per user. First address is auto-set as default. Works for GPS, manual, and Places Autocomplete flows.',
  })
  @ApiResponse({ status: 201, description: 'Address saved successfully' })
  @ApiResponse({ status: 400, description: 'Address limit reached or duplicate address' })
  async saveAddress(@Req() req: any, @Body() dto: SaveAddressDto) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.addressesService.saveAddress(userId, dto);
  }

  /**
   * GET /api/address
   * Returns all saved addresses for the authenticated user (default first).
   */
  @Get()
  @ApiOperation({ summary: 'List all saved addresses (default first)' })
  @ApiResponse({ status: 200, description: 'Address list returned' })
  async getMyAddresses(@Req() req: any) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.addressesService.getUserAddresses(userId);
  }

  /**
   * PATCH /api/address/:id
   * Update address label or set as default delivery address.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update label or set as default' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.addressesService.updateAddress(userId, id, dto);
  }

  /**
   * DELETE /api/address/:id
   * Deletes a saved address. Promotes next most recent to default if needed.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async removeAddress(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub ?? (req.headers['x-user-id'] as string);
    return this.addressesService.removeAddress(userId, id);
  }
}
