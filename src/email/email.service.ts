import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { UserService } from '../user/user.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('GMAIL_USER') || '',
      to,
      subject,
      text,
    });
  }

  async sendEmailToUser(userId: number, subject: string, content: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user?.email) {
      throw new BadRequestException('사용자를 찾을 수 없거나 이메일이 등록되지 않았습니다.');
    }
    await this.sendEmail(user.email, subject, content);
  }
}