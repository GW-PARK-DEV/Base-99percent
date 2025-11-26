import { Controller, Get, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { ProductAnalysisService } from '../product-analysis/product-analysis.service';
import { ItemResponseDto } from './dto/item.dto';

@ApiTags('items')
@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    @Inject(forwardRef(() => ProductAnalysisService))
    private readonly productAnalysisService: ProductAnalysisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '판매 중인 아이템 목록 조회' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getItems(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findAllActive();
    
    return Promise.all(
      items.map(async (item) => {
        const images = await this.itemService.getImageBase64s(item.id);
        const productAnalysis = await this.productAnalysisService.findByItemId(item.id);

        return {
          id: item.id,
          userId: item.userId,
          status: item.status,
          createdAt: item.createdAt,
          images,
          productAnalysis: productAnalysis ? {
            name: productAnalysis.name,
            analysis: productAnalysis.analysis,
            issues: productAnalysis.issues,
            positives: productAnalysis.positives,
            usageLevel: productAnalysis.usageLevel,
            recommendedPrice: productAnalysis.recommendedPrice,
            priceReason: productAnalysis.priceReason,
          } : undefined,
        };
      })
    );
  }
}