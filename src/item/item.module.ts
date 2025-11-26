import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { ItemService } from './item.service';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemImage])],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}