import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FlockAIService } from '../ai/flock-ai.service';
import { JsonService } from '../json/json.service';
import { GoogleSearchService } from '../google-search/google-search.service';
import { BunjangSearchService } from '../bunjang-search/bunjang-search.service';
import { ProductAnalysisResponseDto, ProductAnalysisWithPriceResponseDto } from './dto/product-analysis.dto';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ProductPriceService {
  private readonly systemPrompt: string;

  constructor(
    private readonly aiService: FlockAIService,
    private readonly jsonService: JsonService,
    private readonly googleSearchService: GoogleSearchService,
    private readonly bunjangSearchService: BunjangSearchService,
  ) {
    const promptsDir = join(process.cwd(), 'public', 'prompts', 'product-price');
    const prompt = readFileSync(join(promptsDir, 'product-price.md'), 'utf-8');
    const example = this.jsonService.readFromDir(promptsDir, 'product-price.json');
    this.systemPrompt = `${prompt}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``;
  }

  async calculatePrice(analysis: ProductAnalysisResponseDto): Promise<ProductAnalysisWithPriceResponseDto> {
    const [bunjangResults, googleResults] = await Promise.all([
      this.bunjangSearchService.search(analysis.name, 0, 'score'),
      this.googleSearchService.search({ query: `${analysis.name} 중고`, num: 10 }),
    ]);

    const prompt = this.buildPrompt(analysis, bunjangResults, googleResults);
    const response = await this.aiService.invoke(
      [new SystemMessage(this.systemPrompt), new HumanMessage(prompt)],
    );

    const priceData = this.jsonService.parseFromCodeBlock<{ recommendedPrice: number; priceReason: string }>(response);
    if (!priceData?.recommendedPrice) {
      throw new Error('적정가 산정에 실패했습니다.');
    }

    return { ...analysis, ...priceData };
  }

  private buildPrompt(analysis: ProductAnalysisResponseDto, bunjangResults: any[], googleResults: any): string {
    const analysisText = `물건 이름: ${analysis.name}
상태 분석: ${analysis.analysis}
사용감 정도: ${analysis.usageLevel}
문제점: ${analysis.issues.join(', ') || '없음'}
긍정적 특징: ${analysis.positives.join(', ') || '없음'}`;

    const bunjangText = bunjangResults
      .slice(0, 10)
      .map((item, idx) => `${idx + 1}. ${item.name} - ${item.price}원 (${item.used})`)
      .join('\n') || '검색 결과 없음';

    const googleText = googleResults.items
      .slice(0, 10)
      .map((item, idx) => `${idx + 1}. ${item.title}\n   ${item.snippet}`)
      .join('\n\n') || '검색 결과 없음';

    return `${analysisText}

[번개장터 중고거래 시세]
${bunjangText}

[구글 검색 정보]
${googleText}

위 정보를 바탕으로 물건의 적정 가격을 원화(KRW) 기준으로 제시하고 선정 이유를 설명해주세요.`;
  }
}