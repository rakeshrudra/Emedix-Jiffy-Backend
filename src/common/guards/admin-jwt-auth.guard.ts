import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../../admin/admin.service';

type AuthServiceAccessTokenPayload = {
    sub: string;
    mobile_no: string;
    role: string;
    type: 'access' | 'refresh';
};

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private adminService: AdminService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['access_token'];
        if (!token) {
            throw new UnauthorizedException();
        }

        let payload: AuthServiceAccessTokenPayload;
        try {
            payload = await this.jwtService.verifyAsync<AuthServiceAccessTokenPayload>(
                token,
                {
                    algorithms: ['RS256'],
                    publicKey: this.getPublicKey(),
                },
            );
        } catch {
            throw new UnauthorizedException('Token is invalid or expired');
        }

        if (payload.type !== 'access') {
            throw new UnauthorizedException('Invalid token type');
        }

        const admin = await this.adminService.findByIdentityId(payload.sub);
        if (!admin) {
            throw new UnauthorizedException('Admin is not provisioned');
        }

        request['user'] = {
            sub: admin.id,
            identity_id: admin.identity_id,
            mobile_no: admin.mobile_no,
            username: admin.username,
            store_id: admin.store_id,
            role: admin.role,
        };
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
