import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateTradeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  itemId: number;
}

export class TradeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  itemId: number;

  @ApiProperty()
  buyerId: number;

  @ApiProperty()
  sellerId: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}