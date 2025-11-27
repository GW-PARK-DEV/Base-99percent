import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@farcaster/quick-auth';

@Injectable()
export class QuickAuthService {
  private readonly logger = new Logger(QuickAuthService.name);
  private client = createClient();

  constructor(private readonly configService: ConfigService) {}

  async verifyJwt(token: string): Promise<{ fid: number }> {
    const domain = this.configService.get<string>('QUICK_AUTH_DOMAIN');
    
    this.logger.log(`=== Quick Auth 토큰 검증 시작 ===`);
    this.logger.log(`도메인: ${domain}`);
    this.logger.log(`토큰 앞부분: ${token.substring(0, 50)}...`);
    
    if (!domain) {
      this.logger.error('QUICK_AUTH_DOMAIN 환경변수가 설정되지 않았습니다!');
      throw new Error('QUICK_AUTH_DOMAIN is not configured');
    }

    try {
      const payload = await this.client.verifyJwt({ token, domain });
      this.logger.log(`검증 성공! FID: ${payload.sub}`);
      this.logger.log(`페이로드: ${JSON.stringify(payload)}`);
      return { fid: payload.sub };
    } catch (error) {
      this.logger.error(`검증 실패!`);
      this.logger.error(`에러 타입: ${error?.constructor?.name}`);
      this.logger.error(`에러 메시지: ${error?.message}`);
      this.logger.error(`에러 전체: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}

