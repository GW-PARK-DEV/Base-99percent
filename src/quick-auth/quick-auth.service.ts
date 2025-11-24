import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@farcaster/quick-auth';

@Injectable()
export class QuickAuthService {
  private client = createClient();

  constructor(private readonly configService: ConfigService) {}

  async verifyJwt(token: string): Promise<{ fid: number }> {
    const domain = this.configService.get<string>('QUICK_AUTH_DOMAIN')!;
    const payload = await this.client.verifyJwt({ token, domain });
    return { fid: payload.sub };
  }
}

