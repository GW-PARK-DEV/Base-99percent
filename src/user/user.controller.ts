import {
  Controller,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { UserService } from './user.service';
import { UpdateEmailDto, UserResponseDto } from './dto/user.dto';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('email')
  @UseGuards(QuickAuthGuard)
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
    const updatedUser = await this.userService.updateEmailByFid(req.user.fid, dto.email);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    };
  }
}

