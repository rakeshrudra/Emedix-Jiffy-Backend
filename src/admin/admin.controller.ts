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
  ApiBody,
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

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an admin account for a store' })
  @ApiBody({
    type: AdminSignupDto,
    examples: {
      default: {
        value: {
          username: 'shaikpet_admin',
          password: 'Admin@123',
          store_id: '2',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Admin account created',
    schema: {
      example: {
        success: true,
        message: 'Admin account created successfully',
        data: {
          id: 'admin-id',
          username: 'shaikpet_admin',
          store_id: '2',
          store_name: 'Shaikpet Store',
          created_at: '2026-07-15T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Admin signup is disabled' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  signup(@Body() dto: AdminSignupDto) {
    return this.adminService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an admin with username and password' })
  @ApiBody({
    type: AdminLoginDto,
    examples: {
      default: {
        value: {
          username: 'shaikpet_admin',
          password: 'Admin@123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Admin login successful',
    schema: {
      example: {
        success: true,
        message: 'Admin login successful',
        data: {
          access_token: '<access-token>',
          refresh_token: '<refresh-token>',
          admin: {
            id: 'admin-id',
            username: 'shaikpet_admin',
            store_id: '2',
            store_name: 'Shaikpet Store',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh admin access and refresh tokens' })
  @ApiBody({
    type: AdminRefreshTokenDto,
    examples: {
      default: {
        value: {
          refresh_token: '<refresh-token>',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'New admin tokens issued',
    schema: {
      example: {
        success: true,
        data: {
          access_token: '<new-access-token>',
          refresh_token: '<new-refresh-token>',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  refresh(@Body() dto: AdminRefreshTokenDto) {
    return this.adminService.refresh(dto.refresh_token);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current admin profile' })
  @ApiResponse({
    status: 200,
    description: 'Current admin returned',
    schema: {
      example: {
        success: true,
        data: {
          id: 'admin-id',
          username: 'shaikpet_admin',
          store: {
            id: '2',
            name: 'Shaikpet Store',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Request() req: any) {
    return this.adminService.getCurrentAdmin(req.user?.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out the current admin client-side' })
  @ApiResponse({
    status: 200,
    description: 'Logout acknowledged',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout() {
    return this.adminService.logout();
  }
}
