import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class DeveloperGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as Record<string, unknown>;
    if (!user?.is_developer) {
      throw new ForbiddenException('Требуются права разработчика');
    }
    return true;
  }
}
