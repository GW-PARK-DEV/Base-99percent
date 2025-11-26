import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Gmail SMTP 설정
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'), // Gmail 앱 비밀번호 필요
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    const gmailUser = this.configService.get<string>('GMAIL_USER') || '';
    const from = this.configService.get<string>('GMAIL_FROM') || gmailUser;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  async sendSellerNotification(
    sellerEmail: string,
    itemId: number,
    buyerMessage: string,
    chatId: number,
  ): Promise<void> {
    const subject = `[99percent] 구매자 문의가 도착했습니다 - 아이템 #${itemId}`;
    const text = `
구매자님으로부터 다음 문의가 도착했습니다:

"${buyerMessage}"

이 질문에 대한 답변을 부탁드립니다.
채팅 ID: ${chatId}
아이템 ID: ${itemId}
    `.trim();

    const html = `
      <h2>구매자 문의가 도착했습니다</h2>
      <p>아이템 #${itemId}에 대한 구매자 문의입니다.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${buyerMessage}"</p>
      </div>
      <p>위 질문에 대한 답변을 부탁드립니다.</p>
      <p style="color: #666; font-size: 12px;">채팅 ID: ${chatId} | 아이템 ID: ${itemId}</p>
    `;

    await this.sendEmail(sellerEmail, subject, text, html);
  }
}

