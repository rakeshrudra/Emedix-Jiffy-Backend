import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export type SsoTokenPayload = {
  sub: string;
  mobile_no: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class SsoAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['access_token'];
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: SsoTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<SsoTokenPayload>(token, {
        algorithms: ['RS256'],
        publicKey: this.getPublicKey(),
      });
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    request['sso'] = payload;
    return true;
  }

  private getPublicKey(): string {
    const key = this.configService.get<string>('JWT_PUBLIC_KEY');
    if (!key) {
      throw new Error('JWT_PUBLIC_KEY is required');
    }
    return key.replace(/\\n/g, '\n');
  }
}
