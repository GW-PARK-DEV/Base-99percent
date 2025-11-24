import { Module } from '@nestjs/common';
import { ProductAnalysisController } from './product-analysis.controller';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { FlockAIModule } from '../ai/flock-ai.module';
import { Base64Module } from '../base64/base64.module';
import { JsonModule } from '../json/json.module';
import { GoogleSearchModule } from '../google-search/google-search.module';
import { BunjangSearchModule } from '../bunjang-search/bunjang-search.module';

@Module({
  imports: [FlockAIModule, Base64Module, JsonModule, GoogleSearchModule, BunjangSearchModule],
  controllers: [ProductAnalysisController],
  providers: [ProductAnalysisService, ProductPriceService],
  exports: [ProductAnalysisService, ProductPriceService],
})
export class ProductAnalysisModule {}