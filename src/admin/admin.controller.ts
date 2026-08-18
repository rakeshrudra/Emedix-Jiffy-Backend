import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminProvisionDto } from './dto/admin-provision.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AuthServiceApiKeyGuard } from '../common/guards/auth-service-api-key.guard';

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/admin/auth/signup
   * Internal provisioning endpoint called by Emedix Auth Service to create
   * an admin profile row after it creates the identity. Not user-facing.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthServiceApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: '[Internal] Provision an admin profile for an Emedix Auth Service identity' })
  @ApiResponse({ status: 201, description: 'Admin profile provisioned' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 409, description: 'Admin already exists for this identity, mobile number, or username' })
  signup(@Body() dto: AdminProvisionDto) {
    return this.adminService.provision(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Deprecated] Use Emedix Auth Service login instead' })
  @ApiResponse({ status: 501, description: 'Moved to Emedix Auth Service' })
  login() {
    throw new NotImplementedException(
      'Admin login has moved to Emedix Auth Service',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Deprecated] Use Emedix Auth Service refresh instead' })
  @ApiResponse({ status: 501, description: 'Moved to Emedix Auth Service' })
  refresh() {
    throw new NotImplementedException(
      'Admin token refresh has moved to Emedix Auth Service',
    );
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current admin profile' })
  @ApiResponse({ status: 200, description: 'Current admin returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Request() req: any) {
    return this.adminService.getCurrentAdmin(req.user?.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Log out the current admin, clearing the session's token cookies" })
  @ApiResponse({ status: 200, description: 'Logout acknowledged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_access_token', this.cookieOptions());
    res.clearCookie('admin_refresh_token', this.cookieOptions());
    return { success: true, message: 'Logged out successfully' };
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
