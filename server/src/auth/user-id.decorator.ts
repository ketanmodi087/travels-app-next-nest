import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export const UserId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const userId = request.user?.id;
  if (!userId) {
    throw new UnauthorizedException('User not found in request');
  }
  return userId;
});
