import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { OpenRouterAIService } from '../ai/openrouter-ai.service';
import { JsonService } from '../json/json.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/** 중고거래용 물건 상태 분석 서비스 */
@Injectable()
export class ProductAnalysisService {
  private readonly systemPrompt: string;

  constructor(
    private readonly aiService: OpenRouterAIService,
    private readonly jsonService: JsonService,
  ) {
    const promptsDir = join(__dirname, 'prompts');
    const prompt = readFileSync(join(promptsDir, 'product-analysis.md'), 'utf-8');
    const example = this.jsonService.readFromDir(promptsDir, 'product-analysis.json');
    this.systemPrompt = `${prompt}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``;
  }

  /** 이미지와 텍스트를 바탕으로 물건 상태 분석 */
  async analyzeProduct(dto: ProductAnalysisDto): Promise<ProductAnalysisResponseDto> {
    const imageContents = dto.images.map(imageBase64 => ({
      type: 'image_url' as const,
      image_url: {
        url: imageBase64,
      },
    }));

    const textParts: string[] = [];
    if (dto.description) {
      textParts.push(`판매자 설명: ${dto.description}`);
    }
    if (dto.category) {
      textParts.push(`카테고리: ${dto.category}`);
    }

    const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

    if (textParts.length > 0) {
      content.push({ type: 'text', text: textParts.join('\n') });
    }

    content.push(...imageContents);

    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage({
        content,
      }),
    ];

    const response = await this.aiService.invoke(messages, {
      model: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.3,
    });

    const result = this.parseJSON<ProductAnalysisResponseDto>(response);
    if (!result) {
      throw new Error('물건 상태 분석에 실패했습니다.');
    }

    return result;
  }

  private parseJSON<T>(text: string): T | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    try {
      return JSON.parse(jsonMatch ? jsonMatch[1] : text) as T;
    } catch {
      return null;
    }
  }
}

