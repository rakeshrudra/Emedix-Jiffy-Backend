import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../admin/enums/admin-role.enum';

@ApiTags('App Version')
@Controller('api/app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('android')
  @ApiOperation({
    summary:
      'Get the Android version config (public — called on app launch)',
  })
  @ApiResponse({ status: 200, description: 'Version config returned' })
  getAndroid() {
    return this.appVersionService.getAndroid();
  }

  @Patch('android')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @Roles(AdminRole.EMEDIX_SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the Android version config (superadmin only)',
  })
  @ApiResponse({ status: 200, description: 'Version config updated' })
  @ApiResponse({ status: 403, description: 'Superadmin access required' })
  updateAndroid(@Body() dto: UpdateAppVersionDto) {
    return this.appVersionService.updateAndroid(dto);
  }
}
