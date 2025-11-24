import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { X402Module } from './x402/x402.module';
import { OpenRouterAIModule } from './ai/openrouter-ai.module';
import { GoogleSearchModule } from './google-search/google-search.module';
import { ProductAnalysisModule } from './product-analysis/product-analysis.module';
import { JsonModule } from './json/json.module';
import { BunjangSearchModule } from './bunjang-search/bunjang-search.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    X402Module.forRoot({
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
    }),
    OpenRouterAIModule,
    GoogleSearchModule,
    JsonModule,
    ProductAnalysisModule,
    BunjangSearchModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
