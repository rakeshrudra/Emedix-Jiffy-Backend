import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MapsService } from './maps.service';

@ApiTags('Maps')
@Controller('api/maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get Google Places autocomplete suggestions' })
  @ApiQuery({ name: 'input', required: true, example: 'Ameerpet' })
  async autocomplete(@Query('input') input: string) {
    if (!input || input.trim().length < 2) {
      throw new BadRequestException('Input must be at least 2 characters long');
    }

    return this.mapsService.autocomplete(input.trim());
  }
}