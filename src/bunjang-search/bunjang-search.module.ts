import { Module } from '@nestjs/common';
import { BunjangSearchController } from './bunjang-search.controller';
import { BunjangSearchService } from './bunjang-search.service';

@Module({
  controllers: [BunjangSearchController],
  providers: [BunjangSearchService],
  exports: [BunjangSearchService],
})
export class BunjangSearchModule {}

