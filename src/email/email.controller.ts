import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/email.dto';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: '이메일 전송' })
  @ApiResponse({ status: 201, description: '이메일 전송 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async sendEmail(@Body() dto: SendEmailDto): Promise<{ success: boolean }> {
    await this.emailService.sendEmailToUser(dto.userId, dto.subject, dto.content);
    return { success: true };
  }
}

