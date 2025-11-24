import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { S3Service } from '../s3/s3.service';
import { ProductAnalysis } from './entities/product-analysis.entity';
import { ProductAnalysisDto, ProductAnalysisWithPriceResponseDto } from './dto/product-analysis.dto';

interface ProductAnalysisJobData {
  s3Paths: string[];
  dto: ProductAnalysisDto;
}

@Processor('product-analysis')
@Injectable()
export class ProductAnalysisProcessor extends WorkerHost {
  constructor(
    @InjectRepository(ProductAnalysis)
    private readonly productAnalysisRepository: Repository<ProductAnalysis>,
    private readonly productAnalysisService: ProductAnalysisService,
    private readonly productPriceService: ProductPriceService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job<ProductAnalysisJobData>) {
    const { s3Paths, dto } = job.data;

    // S3에서 파일 다운로드
    const multerFiles: Express.Multer.File[] = await Promise.all(
      s3Paths.map(async (s3Path) => {
        const [bucket, ...keyParts] = s3Path.replace('s3://', '').split('/');
        const key = keyParts.join('/');
        const buffer = await this.s3Service.downloadFile(bucket, key);
        const originalname = keyParts[keyParts.length - 1];
        const mimetype = this.getMimeType(originalname);

        return {
          buffer,
          mimetype,
          originalname,
          fieldname: 'images',
          encoding: '7bit' as const,
          size: buffer.length,
          destination: '',
          filename: originalname,
          path: '',
        } as Express.Multer.File;
      }),
    );

    // 1. 물건 상태 분석
    const analysis = await this.productAnalysisService.analyzeProduct(multerFiles, dto);

    // 2. 적정가 산정
    const analysisWithPrice: ProductAnalysisWithPriceResponseDto =
      await this.productPriceService.calculatePrice(analysis);

    // 3. DB 저장
    const entity = this.productAnalysisRepository.create({
      name: analysisWithPrice.name,
      analysis: analysisWithPrice.analysis,
      issues: analysisWithPrice.issues,
      positives: analysisWithPrice.positives,
      usageLevel: analysisWithPrice.usageLevel,
      recommendedPrice: analysisWithPrice.recommendedPrice,
      priceReason: analysisWithPrice.priceReason,
    });

    await this.productAnalysisRepository.save(entity);

    return { success: true, id: entity.id };
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }
}

