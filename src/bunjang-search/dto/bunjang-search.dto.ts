import { ApiProperty } from '@nestjs/swagger';

export class BunjangProduct {
  @ApiProperty({ description: '상품명' })
  name: string;

  @ApiProperty({ description: '가격' })
  price: string;

  @ApiProperty({ description: '사용 정도', example: '새 상품' })
  used: string;

  @ApiProperty({ description: '무료 배송 여부' })
  free_shipping: boolean;

  @ApiProperty({ description: '태그' })
  tag: string;
}
