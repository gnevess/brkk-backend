import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../interfaces/authenticated.request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // If no roles are required, allow access
    if (requiredRoles.length === 0) {
      return true;
    }

    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const user = request.user as { UserRole?: string[] };

    // Check if user exists and has roles property
    if (!Array.isArray(user.UserRole)) {
      return false;
    }

    // Check if user has any of the required roles
    return user.UserRole.some((role: string) => requiredRoles.includes(role));
  }
}
