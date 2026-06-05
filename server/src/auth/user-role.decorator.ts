import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
  };
};

export const UserRole = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const role = request.user?.role;
  if (!role) {
    throw new UnauthorizedException('User role not found in request');
  }
  return role;
});
