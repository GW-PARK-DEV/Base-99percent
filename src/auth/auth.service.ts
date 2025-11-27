import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QuickAuthService } from '../quick-auth/quick-auth.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly quickAuthService: QuickAuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async loginWithQuickAuth(token: string): Promise<{ accessToken: string }> {
    try {
      const { fid } = await this.quickAuthService.verifyJwt(token);
      const user = await this.userService.findOrCreate(fid);
      
      const accessToken = this.jwtService.sign({ userId: user.id, fid });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');
    }
  }

  async validateUser(userId: number): Promise<{ userId: number } | null> {
    const user = await this.userService.findById(userId);
    return user ? { userId: user.id } : null;
  }

  async signupOrLoginWithEmail(email: string): Promise<void> {
    const user = await this.userService.findOrCreateByEmail(email);
    const accessToken = this.jwtService.sign({ userId: user.id });
    
    await this.emailService.sendEmail(
      email,
      '회원가입/로그인 완료',
      `안녕하세요!\n\n회원가입/로그인이 완료되었습니다.\n\nJWT 토큰:\n${accessToken}\n\n이 토큰을 사용하여 API에 인증할 수 있습니다.`,
    );
  }

  async sendJwtToEmail(userId: number): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user?.email) {
      throw new UnauthorizedException('이메일이 등록되지 않은 사용자입니다.');
    }

    const accessToken = this.jwtService.sign({ userId: user.id });
    
    await this.emailService.sendEmail(
      user.email,
      'JWT 토큰 발급',
      `안녕하세요!\n\n새로운 JWT 토큰이 발급되었습니다.\n\nJWT 토큰:\n${accessToken}\n\n이 토큰을 사용하여 API에 인증할 수 있습니다.`,
    );
  }
}

