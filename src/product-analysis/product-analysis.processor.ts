import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
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

    const files = await Promise.all(s3Paths.map((path) => this.s3Service.downloadFileFromS3Path(path)));
    const analysis = await this.productAnalysisService.analyzeProduct(files, dto);
    const result = await this.productPriceService.calculatePrice(analysis);
    await this.productAnalysisRepository.save(this.productAnalysisRepository.create({ ...result, itemId }));
    
    // analysis 생성 후 item을 active로 변경
    await this.itemService.markAsActive(itemId);
  }
}