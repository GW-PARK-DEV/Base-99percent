import { Module } from '@nestjs/common';
import { ProductAnalysisController } from './product-analysis.controller';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { OpenRouterAIModule } from '../ai/openrouter-ai.module';
import { Base64Module } from '../base64/base64.module';
import { JsonModule } from '../json/json.module';
import { GoogleSearchModule } from '../google-search/google-search.module';
import { BunjangSearchModule } from '../bunjang-search/bunjang-search.module';

@Module({
  imports: [OpenRouterAIModule, Base64Module, JsonModule, GoogleSearchModule, BunjangSearchModule],
  controllers: [ProductAnalysisController],
  providers: [ProductAnalysisService, ProductPriceService],
  exports: [ProductAnalysisService, ProductPriceService],
})
export class ProductAnalysisModule {}