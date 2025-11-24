import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, type: ProductAnalysisResponseDto })
  @ApiResponse({ status: 400 })
  async analyzeProduct(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
  ): Promise<ProductAnalysisResponseDto> {
    dto.images = files;
    return this.productAnalysisService.analyzeProduct(files, dto);
  }

  @Post('analyze-with-price')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: '물건 상태 분석 및 적정가 산정' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: ProductAnalysisWithPriceResponseDto })
  @ApiResponse({ status: 400 })
  async analyzeProductWithPrice(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
  ): Promise<ProductAnalysisWithPriceResponseDto> {
    dto.images = files;
    // 1. 먼저 물건 상태 분석
    const analysis = await this.productAnalysisService.analyzeProduct(files, dto);
    // 2. 적정가 산정
    return this.productPriceService.calculatePrice(analysis);
  }
}
