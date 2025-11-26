import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ProductAnalysisController } from './product-analysis.controller';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { ProductAnalysisProcessor } from './product-analysis.processor';
import { ProductAnalysis } from './entities/product-analysis.entity';
import { FlockAIModule } from '../ai/flock-ai.module';
import { Base64Module } from '../base64/base64.module';
import { JsonModule } from '../json/json.module';
import { GoogleSearchModule } from '../google-search/google-search.module';
import { BunjangSearchModule } from '../bunjang-search/bunjang-search.module';
import { QueueModule } from '../queue/queue.module';
import { S3Module } from '../s3/s3.module';
import { ItemModule } from '../item/item.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductAnalysis]),
    BullModule.registerQueue({ name: 'product-analysis' }),
    FlockAIModule,
    Base64Module,
    JsonModule,
    GoogleSearchModule,
    BunjangSearchModule,
    QueueModule,
    S3Module,
    forwardRef(() => ItemModule),
    UserModule,
  ],
  controllers: [ProductAnalysisController],
  providers: [ProductAnalysisService, ProductPriceService, ProductAnalysisProcessor],
  exports: [ProductAnalysisService, ProductPriceService],
})
export class ProductAnalysisModule {}