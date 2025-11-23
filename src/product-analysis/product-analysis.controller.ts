import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';

@ApiTags('product-analysis')
@Controller('product-analysis')
export class ProductAnalysisController {
  constructor(private readonly productAnalysisService: ProductAnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '물건 상태 분석', description: '이미지와 텍스트를 바탕으로 중고거래용 물건의 상태를 분석합니다.' })
  @ApiBody({ type: ProductAnalysisDto })
  @ApiResponse({
    status: 200,
    description: '분석 성공',
    type: ProductAnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (이미지 URL이 유효하지 않거나 필수 필드 누락)',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류 (AI 분석 실패 등)',
  })
  async analyzeProduct(@Body() dto: ProductAnalysisDto): Promise<ProductAnalysisResponseDto> {
    return this.productAnalysisService.analyzeProduct(dto);
  }
}

