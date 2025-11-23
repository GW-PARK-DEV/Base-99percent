import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ArrayMinSize, MaxLength, Matches } from 'class-validator';

export class ProductAnalysisDto {
  @ApiProperty({
    description: '물건 이미지 Base64 배열 (최소 1개, data:image/jpeg;base64,... 형식)',
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 이미지가 필요합니다.' })
  @Matches(/^data:image\/(jpeg|jpg|png|webp);base64,/, {
    each: true,
    message: '유효한 Base64 이미지 형식이어야 합니다. (data:image/jpeg;base64,...)',
  })
  images: string[];

  @ApiProperty({
    description: '판매자가 제공한 물건 설명',
    example: '아이폰 13 프로, 1년 사용, 케이스와 함께 사용하여 상태 양호',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '설명은 1000자 이하여야 합니다.' })
  description?: string;

  @ApiProperty({
    description: '물건 카테고리',
    example: '전자제품',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class ProductAnalysisResponseDto {
  @ApiProperty({
    description: '전체 상태 평가',
    example: '양호',
  })
  overallCondition: string;

  @ApiProperty({
    description: '상태 점수 (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  conditionScore: number;

  @ApiProperty({
    description: '상세 분석 설명',
    example: '물건이 전반적으로 양호한 상태입니다. 약간의 사용감이 있지만 기능적으로는 문제가 없어 보입니다.',
  })
  analysis: string;

  @ApiProperty({
    description: '발견된 문제점 목록',
    example: ['약간의 스크래치', '케이스 마모'],
    type: [String],
  })
  issues: string[];

  @ApiProperty({
    description: '긍정적인 특징 목록',
    example: ['기능 정상 작동', '원본 박스 보유'],
    type: [String],
  })
  positives: string[];

  @ApiProperty({
    description: '사용감 정도',
    example: '사용감 있음',
  })
  usageLevel: string;
}

