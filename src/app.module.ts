import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { X402Module } from './x402/x402.module';
import { OpenRouterAIModule } from './ai/openrouter-ai.module';
import { GoogleSearchModule } from './google-search/google-search.module';

@Module({
  imports: [
    X402Module.forRoot({
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
    }),
    OpenRouterAIModule,
    GoogleSearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
