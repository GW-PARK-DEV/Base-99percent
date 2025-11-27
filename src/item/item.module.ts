import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ProductAnalysisModule } from '../product-analysis/product-analysis.module';
import { S3Module } from '../s3/s3.module';
import { Base64Module } from '../base64/base64.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemImage]),
    forwardRef(() => ProductAnalysisModule),
    S3Module,
    Base64Module,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}