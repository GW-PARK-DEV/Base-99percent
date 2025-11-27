import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QuickAuthService } from '../quick-auth/quick-auth.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly quickAuthService: QuickAuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async loginWithQuickAuth(token: string): Promise<{ accessToken: string }> {
    this.logger.log(`=== Quick Auth 로그인 시작 ===`);
    this.logger.log(`받은 토큰 길이: ${token?.length}`);
    
    try {
      const { fid } = await this.quickAuthService.verifyJwt(token);
      this.logger.log(`FID 획득: ${fid}`);
      
      const user = await this.userService.findOrCreate(fid);
      this.logger.log(`사용자 조회/생성 완료: userId=${user.id}`);
      
      const accessToken = this.jwtService.sign({ userId: user.id, fid });
      this.logger.log(`JWT 발급 완료`);

      return { accessToken };
    } catch (error) {
      this.logger.error(`로그인 실패!`);
      this.logger.error(`에러: ${error?.message}`);
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
}

