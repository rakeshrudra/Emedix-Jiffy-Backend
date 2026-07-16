import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshTokenDto } from './dto/admin-refresh-token.dto';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * POST /api/admin/auth/signup
   * Creates an admin account for a store.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an admin account for a store' })
  @ApiResponse({ status: 201, description: 'Admin account created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Admin signup is disabled' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  signup(@Body() dto: AdminSignupDto) {
    return this.adminService.signup(dto);
  }

  /**
   * POST /api/admin/auth/login
   * Logs in an admin with username and password.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an admin with username and password' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  /**
   * POST /api/admin/auth/refresh
   * Refreshes admin access and refresh tokens.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh admin access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'New admin tokens issued' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  refresh(@Body() dto: AdminRefreshTokenDto) {
    return this.adminService.refresh(dto.refresh_token);
  }

  /**
   * GET /api/admin/auth/me
   * Returns the current admin profile.
   */
  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current admin profile' })
  @ApiResponse({ status: 200, description: 'Current admin returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Request() req: any) {
    return this.adminService.getCurrentAdmin(req.user?.sub);
  }

  /**
   * POST /api/admin/auth/logout
   * Logs out the current admin client-side.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out the current admin client-side' })
  @ApiResponse({ status: 200, description: 'Logout acknowledged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout() {
    return this.adminService.logout();
  }
}
