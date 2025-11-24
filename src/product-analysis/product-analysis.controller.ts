import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductAnalysisService } from './product-analysis.service';
import { QueueService } from '../queue/queue.service';
import { S3Service } from '../s3/s3.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';

@ApiTags('product-analysis')
@Controller('product-analysis')
export class ProductAnalysisController {
  constructor(
    private readonly productAnalysisService: ProductAnalysisService,
    private readonly queueService: QueueService,
    private readonly s3Service: S3Service,
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
  @ApiResponse({ status: 201, description: '성공', schema: { type: 'boolean', example: true } })
  @ApiResponse({ status: 400 })
  async analyzeProductWithPrice(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
  ): Promise<boolean> {
    if (!files || files.length === 0) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    // 파일을 S3에 업로드하고 큐에 작업 추가
    const s3Paths = await Promise.all(
      files.map(async (file) => {
        const key = `product/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        await this.s3Service.uploadFile('snuai', key, file.buffer, file.mimetype);
        return `s3://snuai/${key}`;
      })
    );

    const queue = this.queueService.getQueue('product-analysis');
    await queue.add('analyze', { s3Paths, dto });

    return true;
  }
}