import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BunjangSearchService } from './bunjang-search.service';
import { BunjangProduct } from './dto/bunjang-search.dto';

@ApiTags('bunjang-search')
@Controller('bunjang-search')
export class BunjangSearchController {
  constructor(private readonly bunjangSearchService: BunjangSearchService) {}

  @Get('search')
  @ApiOperation({ summary: '번개장터 검색' })
  @ApiQuery({ name: 'query', description: '검색할 물건 이름', example: '닌텐도 스위치' })
  @ApiQuery({ name: 'page', description: '페이지 번호', required: false, example: 0 })
  @ApiQuery({ name: 'order', description: '정렬 방식', required: false, example: 'score' })
  @ApiResponse({ status: 200, type: [BunjangProduct] })
  async search(
    @Query('query') query: string,
    @Query('page') page?: number,
    @Query('order') order?: string,
  ): Promise<BunjangProduct[]> {
    return this.bunjangSearchService.search(query, page ? Number(page) : 0, order || 'score');
  }
}

