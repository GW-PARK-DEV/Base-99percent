import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      const payload = this.jwtService.verify(auth.split(' ')[1]);
      const user = await this.authService.validateUser(payload.userId);
      
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');
    }
  }
}

