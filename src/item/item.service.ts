import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
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
    const item = this.itemRepository.create({ userId });
    return this.itemRepository.save(item);
  }

  async findByUserId(userId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { userId } });
  }

  async createItemWithImages(userId: number, imageUrls: string[]): Promise<Item> {
    const item = await this.itemRepository.save({ userId });
    await this.itemImageRepository.save(
      imageUrls.map(imageUrl => ({ itemId: item.id, imageUrl }))
    );
    return item;
  }

}

