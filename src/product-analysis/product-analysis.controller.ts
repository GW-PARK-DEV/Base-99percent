import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body, UseGuards, Request } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ProductAnalysisService } from './product-analysis.service';
import { QueueService } from '../queue/queue.service';
import { S3Service } from '../s3/s3.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { ItemService } from '../item/item.service';
import { UserService } from '../user/user.service';

@ApiTags('product-analysis')
@Controller('product-analysis')
export class ProductAnalysisController {
  constructor(
    private readonly productAnalysisService: ProductAnalysisService,
    private readonly queueService: QueueService,
    private readonly s3Service: S3Service,
    private readonly itemService: ItemService,
    private readonly userService: UserService,
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
  @ApiResponse({ 
    status: 201, 
    description: '물건 상태 분석 성공',
    type: ProductAnalysisResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: '이미지 파일이 없거나 유효하지 않음' 
  })
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
  @UseGuards(QuickAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBearerAuth()
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
  @ApiResponse({ 
    status: 201, 
    description: '성공', 
    schema: { type: 'boolean', example: true } 
  })
  @ApiResponse({ 
    status: 400, 
    description: '이미지 파일이 없거나 유효하지 않음' 
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 토큰이 없거나 유효하지 않음' 
  })
  async analyzeProductWithPrice(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProductAnalysisDto,
    @Request() req: any,
  ): Promise<boolean> {
    if (!files || files.length === 0) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    
    const user = await this.userService.findOrCreate(req.user.fid);
    const s3Paths = await Promise.all(
      files.map(file => {
        const key = `product/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        return this.s3Service.uploadFile('snuai', key, file.buffer, file.mimetype).then(() => `s3://snuai/${key}`);
      })
    );
    const item = await this.itemService.createItemWithImages(user.id, s3Paths);
    await this.queueService.getQueue('product-analysis').add('analyze', { s3Paths, dto, itemId: item.id });
    return true;
  }
}