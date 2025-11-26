import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
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

  async getImageUrls(itemId: number): Promise<string[]> {
    const images = await this.itemImageRepository.find({
      where: { itemId },
      order: { createdAt: 'ASC' },
    });
    return images.map(img => img.imageUrl);
  }

  async findByIdWithImages(id: number): Promise<Item | null> {
    return this.itemRepository.findOne({ where: { id } });
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

