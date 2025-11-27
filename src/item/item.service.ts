import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { S3Service } from '../s3/s3.service';
import { Base64Service } from '../base64/base64.service';
import { ProductAnalysisService } from '../product-analysis/product-analysis.service';
import { ItemResponseDto } from './dto/item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
    private readonly s3Service: S3Service,
    private readonly base64Service: Base64Service,
    @Inject(forwardRef(() => ProductAnalysisService))
    private readonly productAnalysisService: ProductAnalysisService,
  ) {}

  async create(userId: number): Promise<Item> {
    const item = this.itemRepository.create({ userId, status: ItemStatus.ACTIVE });
    return this.itemRepository.save(item);
  }

  async findByUserId(userId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { userId } });
  }

  async findById(id: number): Promise<Item | null> {
    return this.itemRepository.findOne({ where: { id } });
  }

  async createItemWithImages(userId: number, imageUrls: string[]): Promise<Item> {
    const item = await this.itemRepository.save({ userId, status: ItemStatus.ACTIVE });
    await this.itemImageRepository.save(
      imageUrls.map(imageUrl => ({ itemId: item.id, imageUrl }))
    );
    return item;
  }

  async findAllActive(): Promise<Item[]> {
    return this.itemRepository.find({
      where: { status: ItemStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async getImageBase64s(itemId: number): Promise<string[]> {
    const images = await this.itemImageRepository.find({
      where: { itemId },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      images.map(async (img) => {
        const [, bucket, ...keyParts] = img.imageUrl.split('/');
        const buffer = await this.s3Service.downloadFile(bucket, keyParts.join('/'));
        return this.base64Service.encodeFromBuffer(buffer);
      })
    );
  }

  async markAsSold(itemId: number): Promise<Item> {
    const item = await this.findById(itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }
    item.status = ItemStatus.SOLD;
    return this.itemRepository.save(item);
  }
  
  async toItemResponseDto(item: Item): Promise<ItemResponseDto> {
    const [images, productAnalysis] = await Promise.all([
      this.getImageBase64s(item.id),
      this.productAnalysisService.findByItemId(item.id)
    ]);

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
  }

  async findAllActiveWithDetails(): Promise<ItemResponseDto[]> {
    const items = await this.findAllActive();
    return Promise.all(items.map(item => this.toItemResponseDto(item)));
  }

  async findByUserIdWithDetails(userId: number): Promise<ItemResponseDto[]> {
    const items = await this.findByUserId(userId);
    return Promise.all(items.map(item => this.toItemResponseDto(item)));
  }

  async findByIdWithDetails(id: number): Promise<ItemResponseDto> {
    const item = await this.findById(id);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }
    return this.toItemResponseDto(item);
  }
}

