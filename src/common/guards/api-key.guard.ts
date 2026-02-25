import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'] as string;
        const validKey = this.configService.get<string>('API_KEY');

        if (!apiKey || apiKey !== validKey) {
            throw new UnauthorizedException('Invalid or missing API key');
        }

        return true;
    }
}
