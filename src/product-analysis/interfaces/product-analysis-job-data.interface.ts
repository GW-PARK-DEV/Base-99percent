import { ProductAnalysisDto } from '../dto/product-analysis.dto';

export interface ProductAnalysisJobData {
  s3Paths: string[];
  dto: ProductAnalysisDto;
  itemId: number;
}