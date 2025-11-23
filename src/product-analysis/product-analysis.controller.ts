import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductAnalysisDto, ProductAnalysisResponseDto } from './dto/product-analysis.dto';

@ApiTags('product-analysis')
@Controller('product-analysis')
export class ProductAnalysisController {
  constructor(private readonly productAnalysisService: ProductAnalysisService) {}

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
}
