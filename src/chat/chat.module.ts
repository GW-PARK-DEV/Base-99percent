import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ItemModule } from '../item/item.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { ProductAnalysis } from '../product-analysis/entities/product-analysis.entity';
import { JsonModule } from '../json/json.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message, ProductAnalysis]),
    forwardRef(() => ItemModule),
    forwardRef(() => UserModule),
    forwardRef(() => EmailModule),
    JsonModule,
    forwardRef(() => AuthModule),
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}

