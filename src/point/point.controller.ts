import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PointService } from './point.service';
import { PointsResponseDto } from './dto/point.dto';

@ApiTags('point')
@Controller('points')
export class PointController {
  constructor(
    private readonly pointService: PointService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 포인트 조회' })
  @ApiResponse({ status: 200, type: PointsResponseDto })
  @ApiResponse({ status: 401 })
  async getPoints(@Request() req: any): Promise<PointsResponseDto> {
    return { totalPoints: await this.pointService.getUserTotalPoints(req.user.userId) };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '포인트 내역 조회' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  async getPointHistory(@Request() req: any) {
    return this.pointService.getUserPointHistory(req.user.userId);
  }
}

