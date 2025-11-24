import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import {
  ProductAnalysisDto,
  ProductAnalysisResponseDto,
  ProductAnalysisWithPriceResponseDto,
} from './dto/product-analysis.dto';

@ApiTags('product-analysis')
@Controller('product-analysis')
export class ProductAnalysisController {
  constructor(
    private readonly productAnalysisService: ProductAnalysisService,
    private readonly productPriceService: ProductPriceService,
  ) {}

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: '물건 상태 분석' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '물건 이미지 파일 (최대 10개)',
        },
        description: {
          type: 'string',
          description: '판매자가 제공한 물건 설명',
          example: '아이폰 13 프로, 1년 사용, 상태 양호',
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({ status: 201, type: ProductAnalysisResponseDto })
  @ApiResponse({ status: 400 })
  async analyzeProduct(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
  ): Promise<ProductAnalysisResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    return this.productAnalysisService.analyzeProduct(files, dto);
  }

  @Post('analyze-with-price')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: '물건 상태 분석 및 적정가 산정' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '물건 이미지 파일 (최대 10개)',
        },
        description: {
          type: 'string',
          description: '판매자가 제공한 물건 설명',
          example: '아이폰 13 프로, 1년 사용, 상태 양호',
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({ status: 201, type: ProductAnalysisWithPriceResponseDto })
  @ApiResponse({ status: 400 })
  async analyzeProductWithPrice(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
  ): Promise<ProductAnalysisWithPriceResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    const analysis = await this.productAnalysisService.analyzeProduct(files, dto);
    return this.productPriceService.calculatePrice(analysis);
  }
}
