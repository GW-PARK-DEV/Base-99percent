import { Module } from '@nestjs/common';
import { ProductAnalysisController } from './product-analysis.controller';
import { ProductAnalysisService } from './product-analysis.service';
import { OpenRouterAIModule } from '../ai/openrouter-ai.module';
import { Base64Module } from '../base64/base64.module';

@Module({
  imports: [OpenRouterAIModule, Base64Module],
  controllers: [ProductAnalysisController],
  providers: [ProductAnalysisService],
  exports: [ProductAnalysisService],
})
export class ProductAnalysisModule {}