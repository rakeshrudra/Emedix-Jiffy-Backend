import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SendOtpDto, VerifyOtpDto } from './dto/auth-otp.dto.js';
import { JwtAuthGuard } from './auth.guard.js';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('get-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to mobile number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async getOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.getOtp(sendOtpDto.mobile_no);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to mobile number' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.resendOtp(sendOtpDto.mobile_no);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and return token' })
  @ApiResponse({ status: 200, description: 'User verified and authenticated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.mobile_no, verifyOtpDto.otp);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile info' })
  @ApiResponse({ status: 200, description: 'User profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}
