import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ example: '안녕하세요' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '이메일 본문 내용입니다.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

