import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ProductAnalysisModule } from '../product-analysis/product-analysis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemImage]),
    forwardRef(() => ProductAnalysisModule),
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}