import { Global, Module } from '@nestjs/common';
import { QuickAuthService } from './quick-auth.service';
import { QuickAuthGuard } from './quick-auth.guard';

@Global()
@Module({
  providers: [QuickAuthService, QuickAuthGuard],
  exports: [QuickAuthService, QuickAuthGuard],
})
export class QuickAuthModule {}

