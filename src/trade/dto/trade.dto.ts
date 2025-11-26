import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min } from 'class-validator';

export class CreateTradeDto {
  @ApiProperty({
    description: '거래할 아이템 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiProperty({
    description: '거래 가격',
    example: 100000,
  })
  @IsInt()
  @Min(1)
  price: number;
}

export class TradeResponseDto {
  @ApiProperty({ description: '거래 ID' })
  id: number;

  @ApiProperty({ description: '아이템 ID' })
  itemId: number;

  @ApiProperty({ description: '구매자 ID' })
  buyerId: number;

  @ApiProperty({ description: '판매자 ID' })
  sellerId: number;

  @ApiProperty({ description: '거래 가격' })
  price: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

