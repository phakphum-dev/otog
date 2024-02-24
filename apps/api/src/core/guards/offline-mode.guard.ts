import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, AccessState, OFFLINE_KEY } from '../constants';

@Injectable()
export class OfflineModeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const accessibility = this.reflector.getAllAndOverride<AccessState>(
      OFFLINE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (accessibility === AccessState.Public) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === Role.Admin) {
      return true;
    }

    if (accessibility === AccessState.Authenticated) {
      return user.role === Role.User;
    }

    return false;
  }
}
