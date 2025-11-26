import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FlockAIService } from '../ai/flock-ai.service';
import { JsonService } from '../json/json.service';
import { Base64Service } from '../base64/base64.service';
import { UserService } from '../user/user.service';
import { ProductAnalysis } from './entities/product-analysis.entity';
import { ProductAnalysisDto, ProductAnalysisResponseDto, ProductAnalysisWithPriceResponseDto } from './dto/product-analysis.dto';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ProductAnalysisService {
  private readonly systemPrompt: string;

  constructor(
    @InjectRepository(ProductAnalysis)
    private readonly productAnalysisRepository: Repository<ProductAnalysis>,
    private readonly aiService: FlockAIService,
    private readonly jsonService: JsonService,
    private readonly base64Service: Base64Service,
    private readonly userService: UserService,
  ) {
    const promptsDir = join(process.cwd(), 'public', 'prompts', 'product-analysis');
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
    );

    const result = this.jsonService.parseFromCodeBlock<ProductAnalysisResponseDto>(response);
    if (!result) {
      throw new Error('물건 상태 분석에 실패했습니다.');
    }

    return result;
  }

  private toResponseDto(analysis: ProductAnalysis): ProductAnalysisWithPriceResponseDto {
    return {
      name: analysis.name,
      analysis: analysis.analysis,
      issues: analysis.issues,
      positives: analysis.positives,
      usageLevel: analysis.usageLevel,
      recommendedPrice: analysis.recommendedPrice || 0,
      priceReason: analysis.priceReason || '',
    };
  }

  /** 아이템 ID로 상품 분석 조회 */
  async findByItemId(itemId: number): Promise<ProductAnalysisWithPriceResponseDto | null> {
    const analysis = await this.productAnalysisRepository.findOne({
      where: { itemId },
      order: { createdAt: 'DESC' },
    });

    return analysis ? this.toResponseDto(analysis) : null;
  }

  /** 사용자 ID로 사용자의 모든 상품 분석 조회 */
  async findByUserId(userId: number): Promise<ProductAnalysisWithPriceResponseDto[]> {
    const analyses = await this.productAnalysisRepository
      .createQueryBuilder('pa')
      .innerJoin('pa.item', 'item')
      .where('item.userId = :userId', { userId })
      .orderBy('pa.createdAt', 'DESC')
      .getMany();

    return analyses.map(analysis => this.toResponseDto(analysis));
  }
}

