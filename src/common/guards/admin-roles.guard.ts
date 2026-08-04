import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../../admin/enums/admin-role.enum';
import { ADMIN_ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const role = request.user?.role;

    if (!roles.includes(role)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
