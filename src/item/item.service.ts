import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async create(userId: number): Promise<Item> {
    const item = this.itemRepository.create({ userId });
    return this.itemRepository.save(item);
  }

  async findByUserId(userId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { userId } });
  }
}

