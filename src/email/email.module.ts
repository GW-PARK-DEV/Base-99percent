import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}