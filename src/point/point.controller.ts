import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { PointService } from './point.service';
import { UserService } from '../user/user.service';
import { PointsResponseDto } from './dto/point.dto';

@ApiTags('point')
@Controller('points')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseGuards(QuickAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 포인트 조회' })
  @ApiResponse({ status: 200, type: PointsResponseDto })
  @ApiResponse({ status: 401, description: '인증 토큰이 없거나 유효하지 않음' })
  async getPoints(@Request() req: any): Promise<PointsResponseDto> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const totalPoints = await this.pointService.getUserTotalPoints(user.id);

    return { totalPoints };
  }
}

