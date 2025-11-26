import { Controller, Get, Param, ParseIntPipe, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { ProductAnalysisService } from '../product-analysis/product-analysis.service';
import { ItemResponseDto, ItemWithImagesResponseDto, ItemDetailResponseDto } from './dto/item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemImage } from './entities/item-image.entity';

@ApiTags('items')
@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    @Inject(forwardRef(() => ProductAnalysisService))
    private readonly productAnalysisService: ProductAnalysisService,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
  ) {}

  @Get()
  @ApiOperation({ summary: '판매 중인 아이템 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '아이템 목록 조회 성공',
    type: [ItemWithImagesResponseDto],
  })
  async getItems(): Promise<ItemWithImagesResponseDto[]> {
    const items = await this.itemService.findAllActive();
    
    const itemsWithImages = await Promise.all(
      items.map(async (item) => {
        const images = await this.itemImageRepository.find({
          where: { itemId: item.id },
          order: { createdAt: 'ASC' },
        });

        return {
          id: item.id,
          userId: item.userId,
          status: item.status,
          createdAt: item.createdAt,
          images: images.map(img => img.imageUrl),
        };
      })
    );

    return itemsWithImages;
  }

  @Get(':id')
  @ApiOperation({ summary: '아이템 상세 조회' })
  @ApiParam({
    name: 'id',
    description: '아이템 ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '아이템 상세 조회 성공',
    type: ItemDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '아이템을 찾을 수 없음',
  })
  async getItemDetail(@Param('id', ParseIntPipe) id: number): Promise<ItemDetailResponseDto> {
    const item = await this.itemService.findByIdWithImages(id);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    const images = await this.itemImageRepository.find({
      where: { itemId: item.id },
      order: { createdAt: 'ASC' },
    });

    const productAnalysis = await this.productAnalysisService.findByItemId(item.id);

    return {
      id: item.id,
      userId: item.userId,
      status: item.status,
      createdAt: item.createdAt,
      images: images.map(img => img.imageUrl),
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
  }
}

