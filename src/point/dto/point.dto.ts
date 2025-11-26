import { ApiProperty } from '@nestjs/swagger';

export class PointsResponseDto {
  @ApiProperty({ description: '총 포인트' })
  totalPoints: number;
}

