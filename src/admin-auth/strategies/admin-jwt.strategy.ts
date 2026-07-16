import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AdminAuthService,
  SafeAuthenticatedAdmin,
} from '../admin-auth.service';
import { AdminAccessTokenPayload } from '../interfaces/admin-jwt-payload.interface';

@Injectable()
export class AdminJwtStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  async authenticate(request: Request): Promise<SafeAuthenticatedAdmin> {
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: AdminAccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminAccessTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('ADMIN_JWT_ACCESS_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    if (payload.token_type !== 'admin_access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return this.adminAuthService.validateAdminAccessPayload(payload);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
