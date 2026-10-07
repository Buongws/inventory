import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AccessClaims } from "./types/auth.types";
import { UserRole } from "./entities/user.entity";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessClaims =>
    context.switchToHttp().getRequest().user,
);

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const header = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AccessClaims;
    }>().headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new UnauthorizedException("Bearer access token is required");
    context.switchToHttp().getRequest().user =
      await this.auth.verifyAccessToken(header.slice(7));
    return true;
  }
}

export function requireRole(...roles: UserRole[]) {
  @Injectable()
  class RoleGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
      const user = context
        .switchToHttp()
        .getRequest<{ user?: AccessClaims }>().user;
      return !!user && roles.includes(user.role);
    }
  }
  return RoleGuard;
}
