import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { QuickAuthService } from './quick-auth.service';

@Injectable()
export class QuickAuthGuard implements CanActivate {
  constructor(private readonly quickAuthService: QuickAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    try {
      const { fid } = await this.quickAuthService.verifyJwt(auth.split(' ')[1]);
      request.user = { fid };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

