import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { X402Module } from './x402/x402.module';
import { OpenRouterAIModule } from './ai/openrouter-ai.module';
import { FlockAIModule } from './ai/flock-ai.module';
import { GoogleSearchModule } from './google-search/google-search.module';
import { ProductAnalysisModule } from './product-analysis/product-analysis.module';
import { JsonModule } from './json/json.module';
import { BunjangSearchModule } from './bunjang-search/bunjang-search.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST')!,
        port: configService.get<number>('DB_PORT')!,
        username: configService.get<string>('DB_USERNAME')!,
        password: configService.get<string>('DB_PASSWORD')!,
        database: configService.get<string>('DB_DATABASE')!,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    X402Module.forRoot({
      facilitatorUrl: process.env.X402_FACILITATOR_URL!,
    }),
    OpenRouterAIModule,
    FlockAIModule,
    GoogleSearchModule,
    JsonModule,
    ProductAnalysisModule,
    BunjangSearchModule,
    RedisModule,
    QueueModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
