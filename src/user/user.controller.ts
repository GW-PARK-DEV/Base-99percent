import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserService } from './user.service';
import { UpdateEmailDto, UserResponseDto } from './dto/user.dto';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401 })
  async getMe(@Request() req: any): Promise<UserResponseDto> {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  @Put('email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 이메일 업데이트' })
  @ApiResponse({
    status: 200,
    description: '이메일 업데이트 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 이메일 형식',
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  async updateEmail(
    @Body() dto: UpdateEmailDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateEmail(req.user.userId, dto.email);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    };
  }
}

