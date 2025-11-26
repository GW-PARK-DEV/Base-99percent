import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty, Min } from 'class-validator';

export class WithdrawPointsDto {
  @ApiProperty({
    description: '출금할 포인트',
    example: 100000,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: '출금 사유',
    example: '지갑으로 출금',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  reason?: string;
}

export class PointsResponseDto {
  @ApiProperty({ description: '총 포인트' })
  totalPoints: number;
}

