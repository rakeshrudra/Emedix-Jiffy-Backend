import {
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
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Deprecated] Use Emedix Auth Service signup instead' })
  @ApiResponse({ status: 501, description: 'Moved to Emedix Auth Service' })
  signup() {
    throw new NotImplementedException(
      'Admin signup has moved to Emedix Auth Service',
    );
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
