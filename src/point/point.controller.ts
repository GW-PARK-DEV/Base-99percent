import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { PointService } from './point.service';
import { UserService } from '../user/user.service';
import { WithdrawPointsDto } from './dto/point.dto';

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
  @ApiResponse({
    status: 200,
    description: '포인트 조회 성공',
    schema: {
      type: 'object',
      properties: {
        totalPoints: {
          type: 'number',
          description: '총 포인트',
          example: 100000,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  async getPoints(@Request() req: any): Promise<{ totalPoints: number }> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const totalPoints = await this.pointService.getUserTotalPoints(user.id);

    return { totalPoints };
  }

  @Post('withdraw')
  @UseGuards(QuickAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '포인트 출금' })
  @ApiResponse({
    status: 200,
    description: '포인트 출금 성공',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: '포인트 출금이 완료되었습니다.',
        },
        remainingPoints: {
          type: 'number',
          example: 50000,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '포인트 부족 또는 잘못된 요청',
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  async withdrawPoints(
    @Body() dto: WithdrawPointsDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string; remainingPoints: number }> {
    const user = await this.userService.findOrCreate(req.user.fid);
    await this.pointService.withdrawPoints(
      user.id,
      dto.amount,
      dto.reason || '포인트 출금',
    );

    const remainingPoints = await this.pointService.getUserTotalPoints(user.id);

    return {
      success: true,
      message: '포인트 출금이 완료되었습니다.',
      remainingPoints,
    };
  }
}

