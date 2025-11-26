import { ApiProperty } from '@nestjs/swagger';
import { ItemStatus } from '../entities/item.entity';

export class ItemResponseDto {
  @ApiProperty({ description: '아이템 ID' })
  id: number;

  @ApiProperty({ description: '판매자 ID' })
  userId: number;

  @ApiProperty({ description: '아이템 상태', enum: ItemStatus })
  status: ItemStatus;

  @ApiProperty({ description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ description: '이미지 목록', type: [String] })
  images: string[];

  @ApiProperty({ description: '상품 분석 정보', nullable: true })
  productAnalysis?: {
    name: string;
    analysis: string;
    issues: string[];
    positives: string[];
    usageLevel: string;
    recommendedPrice: number;
    priceReason: string;
  };
}