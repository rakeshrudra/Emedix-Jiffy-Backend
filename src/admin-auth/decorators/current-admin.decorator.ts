import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SafeAuthenticatedAdmin } from '../admin-auth.service';

interface AdminRequest extends Request {
  user?: SafeAuthenticatedAdmin;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AdminRequest>();
    return request.user;
  },
);
