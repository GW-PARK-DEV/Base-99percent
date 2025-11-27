import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class QuickAuthLoginDto {
  @ApiProperty({
    description: 'Quick Auth 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class EmailSignupLoginDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력하세요.' })
  @IsNotEmpty()
  email: string;
}

