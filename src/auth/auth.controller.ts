import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { QuickAuthLoginDto, LoginResponseDto, EmailSignupLoginDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/quick-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick Auth로 로그인 및 JWT 발급' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 인증 토큰',
  })
  async loginWithQuickAuth(@Body() dto: QuickAuthLoginDto): Promise<LoginResponseDto> {
    return this.authService.loginWithQuickAuth(dto.token);
  }

  @Post('signup-login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일로 회원가입/로그인 및 JWT 이메일 발송' })
  @ApiResponse({
    status: 200,
    description: '이메일 발송 성공',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 이메일 형식',
  })
  async signupOrLoginWithEmail(@Body() dto: EmailSignupLoginDto): Promise<{ message: string }> {
    await this.authService.signupOrLoginWithEmail(dto.email);
    return { message: '이메일로 JWT 토큰이 발송되었습니다.' };
  }
}

