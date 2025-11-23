import { Module } from '@nestjs/common';
import { ProductAnalysisController } from './product-analysis.controller';
import { ProductAnalysisService } from './product-analysis.service';
import { OpenRouterAIModule } from '../ai/openrouter-ai.module';

@Module({
  imports: [OpenRouterAIModule],
  controllers: [ProductAnalysisController],
  providers: [ProductAnalysisService],
  exports: [ProductAnalysisService],
})
export class ProductAnalysisModule {}