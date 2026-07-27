import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

const ACCESS_TOKEN_COOKIE = 'admin_access_token';
const REFRESH_TOKEN_COOKIE = 'admin_refresh_token';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15m
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30d

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

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
   * Logs in an admin with username and password; issues tokens as httpOnly cookies.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an admin with username and password' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminService.login(dto.username, dto.password);
    return this.attachTokenCookiesAndStrip(res, result);
  }

  /**
   * POST /api/admin/auth/refresh
   * Reads the refresh token from its httpOnly cookie and issues a new token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh admin access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'New admin tokens issued' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refresh_token) {
      throw new UnauthorizedException();
    }
    const result = await this.adminService.refresh(refresh_token);
    return this.attachTokenCookiesAndStrip(res, result);
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
   * Clears the admin's token cookies server-side.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Log out the current admin, clearing the session's token cookies" })
  @ApiResponse({ status: 200, description: 'Logout acknowledged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
    return this.adminService.logout();
  }

  private attachTokenCookiesAndStrip<
    T extends { data: { access_token: string; refresh_token: string } },
  >(res: Response, result: T) {
    res.cookie(ACCESS_TOKEN_COOKIE, result.data.access_token, {
      ...this.cookieOptions(),
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, result.data.refresh_token, {
      ...this.cookieOptions(),
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    const { access_token: _access, refresh_token: _refresh, ...restData } =
      result.data;
    return { ...result, data: restData };
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
