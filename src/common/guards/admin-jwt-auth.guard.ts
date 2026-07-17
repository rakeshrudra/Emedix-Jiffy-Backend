import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['admin_access_token'];
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('ADMIN_JWT_ACCESS_SECRET'),
            });
            if (payload.token_type !== 'admin_access') {
                throw new UnauthorizedException('Invalid token type');
            }
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException('Token is invalid or expired');
        }
        return true;
    }
}
