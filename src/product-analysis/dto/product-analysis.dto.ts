import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProductAnalysisDto {
  @ApiProperty({
    type: 'string',
    description: '판매자가 제공한 물건 설명',
    example: '아이폰 13 프로, 1년 사용, 상태 양호',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProductAnalysisResponseDto {
  @ApiProperty({
    description: '물건 이름',
    example: '아이폰 13 프로',
  })
  name: string;

  @ApiProperty({
    description: '상태 분석 설명',
    example: '물건이 전반적으로 양호한 상태입니다. 약간의 사용감이 있지만 기능적으로는 문제가 없어 보입니다.',
  })
  analysis: string;

  @ApiProperty({ description: '발견된 문제점 목록', example: ['약간의 스크래치', '케이스 마모'] })
  issues: string[];

  @ApiProperty({ description: '긍정적인 특징 목록', example: ['기능 정상 작동', '원본 박스 보유'] })
  positives: string[];

  @ApiProperty({ description: '사용감 정도', example: '사용감 있음' })
  usageLevel: string;
}

export class ProductAnalysisWithPriceResponseDto extends ProductAnalysisResponseDto {
  @ApiProperty({ description: '적정 가격', example: 850000 })
  recommendedPrice: number;

  @ApiProperty({ description: '가격 선정 이유', example: '유사한 상태의 거래 물품 15건을 분석한 결과, 적정가는 약 85만원으로 추정됩니다.' })
  priceReason: string;
}