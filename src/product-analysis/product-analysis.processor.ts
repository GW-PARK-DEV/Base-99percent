import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { S3Service } from '../s3/s3.service';
import { ProductAnalysis } from './entities/product-analysis.entity';
import { ProductAnalysisJobData } from './interfaces/product-analysis-job-data.interface';

@Processor('product-analysis')
@Injectable()
export class ProductAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductAnalysisProcessor.name);

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
    const jobId = job.id;
    this.logger.log(`[${jobId}] 작업 시작`);

    try {
      const files = await Promise.all(s3Paths.map((path) => this.s3Service.downloadFileFromS3Path(path)));
      this.logger.log(`[${jobId}] 파일 다운로드 완료`);

      const analysis = await this.productAnalysisService.analyzeProduct(files, dto);
      this.logger.log(`[${jobId}] 제품 분석 완료`);

      const result = await this.productPriceService.calculatePrice(analysis);
      this.logger.log(`[${jobId}] 가격 계산 완료`);

      const entity = await this.productAnalysisRepository.save(this.productAnalysisRepository.create(result));
      this.logger.log(`[${jobId}] 저장 완료 (ID: ${entity.id})`);
    } catch (error) {
      this.logger.error(`[${jobId}] 작업 실패: ${error.message}`, error.stack);
      throw error;
    }
  }
}

