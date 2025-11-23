import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { OpenRouterAIService } from '../ai/openrouter-ai.service';
import { JsonService } from '../json/json.service';
import { Base64Service } from '../base64/base64.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ProductAnalysisService {
  private readonly systemPrompt: string;

  constructor(
    private readonly aiService: OpenRouterAIService,
    private readonly jsonService: JsonService,
    private readonly base64Service: Base64Service,
  ) {
    const promptsDir = join(__dirname, 'prompts');
    const prompt = readFileSync(join(promptsDir, 'product-analysis.md'), 'utf-8');
    const example = this.jsonService.readFromDir(promptsDir, 'product-analysis.json');
    this.systemPrompt = `${prompt}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``;
  }

  /** 이미지와 텍스트를 바탕으로 물건 상태 분석 */
  async analyzeProduct(files: Express.Multer.File[], dto: ProductAnalysisDto): Promise<ProductAnalysisResponseDto> {
    const imageContents = files.map(file => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:${file.mimetype || 'image/jpeg'};base64,${this.base64Service.encodeFromFile(file)}`,
      },
    }));

    const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

    if (dto.description) {
      content.push({ type: 'text', text: `판매자가 제공한 물건 설명: ${dto.description}` });
    }

    content.push(...imageContents);

    const response = await this.aiService.invoke(
      [new SystemMessage(this.systemPrompt), new HumanMessage({ content })],
      { model: 'google/gemini-2.5-pro', temperature: 0.3 },
    );

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

