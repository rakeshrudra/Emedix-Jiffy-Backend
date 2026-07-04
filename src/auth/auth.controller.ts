import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  VerifyFirebaseTokenDto,
  RefreshTokenDto,
  UpdateProfileDto,
} from './dto/auth-otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * POST /api/auth/verify-token
   * Client completes Firebase OTP → sends ID Token here → receives access + refresh tokens.
   * is_new_user flag tells the app to prompt for name entry before home screen.
   */
  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Firebase Phone Auth token',
    description:
      'Exchange Firebase ID Token for a short-lived access token (15m) and a long-lived refresh token (30d). Check is_new_user to show the name entry screen.',
  })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired Firebase token' })
  async verifyToken(@Body() dto: VerifyFirebaseTokenDto) {
    return this.authService.verifyFirebaseToken(dto.idToken);
  }

  /**
   * POST /api/auth/refresh
   * Exchange a valid refresh token for a new access token.
   * Call this when the access token returns 401.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a valid refresh token for a new 15-minute access token. No login required.',
  })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid or expired' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refresh_token);
  }

  /**
   * PATCH /api/auth/profile
   * Set or update the user's display name.
   * Called after new user registration before the home screen.
   */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile (name)',
    description: 'Set or update the authenticated user\'s display name. Call this after is_new_user = true.',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user?.sub ?? (req.headers['x-user-id'] as string), dto.name);
  }

  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user?.sub ?? (req.headers['x-user-id'] as string));
  }
}
