import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SafeAuthenticatedAdmin } from '../admin-auth.service';
import { AdminJwtStrategy } from '../strategies/admin-jwt.strategy';

interface AdminRequest extends Request {
  user?: SafeAuthenticatedAdmin;
}

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly adminJwtStrategy: AdminJwtStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    request.user = await this.adminJwtStrategy.authenticate(request);
    return true;
  }
}
