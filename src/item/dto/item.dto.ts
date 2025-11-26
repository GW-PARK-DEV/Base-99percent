import { ApiProperty } from '@nestjs/swagger';
import { ItemStatus } from '../entities/item.entity';

export class ItemResponseDto {
  @ApiProperty({ description: '아이템 ID' })
  id: number;

  @ApiProperty({ description: '판매자 ID' })
  userId: number;

  @ApiProperty({ description: '아이템 상태', enum: ItemStatus })
  status: ItemStatus;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

export class ItemWithImagesResponseDto extends ItemResponseDto {
  @ApiProperty({ description: '이미지 URL 목록', type: [String] })
  images: string[];
}

export class ItemDetailResponseDto extends ItemWithImagesResponseDto {
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

