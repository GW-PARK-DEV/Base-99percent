import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenRouterAIService } from './openrouter-ai.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenRouterAIService],
  exports: [OpenRouterAIService],
})
export class OpenRouterAIModule {}

