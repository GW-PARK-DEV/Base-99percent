import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAnalysisService } from './product-analysis.service';
import { ProductPriceService } from './product-price.service';
import { S3Service } from '../s3/s3.service';
import { ProductAnalysis } from './entities/product-analysis.entity';
import { ProductAnalysisJobData } from './interfaces/product-analysis-job-data.interface';
import { ItemService } from '../item/item.service';

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
    @Inject(forwardRef(() => ItemService))
    private readonly itemService: ItemService,
  ) {
    super();
  }

  async process(job: Job<ProductAnalysisJobData>) {
    const { s3Paths, dto, itemId } = job.data;

    this.logger.log(`=== 상품 분석 시작: itemId=${itemId} ===`);
    
    const files = await Promise.all(s3Paths.map((path) => this.s3Service.downloadFileFromS3Path(path)));
    this.logger.log(`파일 다운로드 완료: ${files.length}개`);
    
    const analysis = await this.productAnalysisService.analyzeProduct(files, dto);
    this.logger.log(`AI 분석 완료`);
    
    const result = await this.productPriceService.calculatePrice(analysis);
    this.logger.log(`가격 계산 완료: ${result.recommendedPrice}`);
    
    await this.productAnalysisRepository.save(this.productAnalysisRepository.create({ ...result, itemId }));
    this.logger.log(`분석 결과 저장 완료`);
    
    // analysis 생성 후 item을 active로 변경
    await this.itemService.markAsActive(itemId);
    this.logger.log(`아이템 상태 ACTIVE로 변경 완료: itemId=${itemId}`);
  }
}