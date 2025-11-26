import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { S3Service } from '../s3/s3.service';
import { Base64Service } from '../base64/base64.service';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
    private readonly s3Service: S3Service,
    private readonly base64Service: Base64Service,
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
}

