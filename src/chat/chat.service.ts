import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ProductAnalysis } from '../product-analysis/entities/product-analysis.entity';
import { ItemService } from '../item/item.service';
import { UserService } from '../user/user.service';
import { FlockAIService } from '../ai/flock-ai.service';
import { EmailService } from '../email/email.service';
import { JsonService } from '../json/json.service';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatAIResponseDto, EmailContentDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly systemPrompt: string;
  private readonly emailPrompt: string;

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ProductAnalysis)
    private readonly productAnalysisRepository: Repository<ProductAnalysis>,
    private readonly itemService: ItemService,
    private readonly userService: UserService,
    private readonly flockAIService: FlockAIService,
    private readonly emailService: EmailService,
    private readonly jsonService: JsonService,
  ) {
    const promptsDir = join(process.cwd(), 'public', 'prompts', 'chat');
    this.systemPrompt = this.loadPrompt(promptsDir, 'chat');
    this.emailPrompt = this.loadPrompt(promptsDir, 'email');
  }

  private loadPrompt(dir: string, name: string): string {
    const prompt = readFileSync(join(dir, `${name}.md`), 'utf-8');
    const example = this.jsonService.readFromDir(dir, `${name}.json`);
    return `${prompt}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``;
  }

  private async getMessages(chatId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async createChat(buyerId: number, itemId: number): Promise<void> {
    const item = await this.itemService.findById(itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    if (item.userId === buyerId) {
      throw new ForbiddenException('자신의 아이템에는 채팅을 시작할 수 없습니다.');
    }

    const existingChat = await this.chatRepository.findOne({
      where: { itemId, buyerId, sellerId: item.userId },
    });

    if (!existingChat) {
      await this.chatRepository.save({ itemId, buyerId, sellerId: item.userId });
    }
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    message: string,
  ): Promise<void> {
    const chat = await this.findChatWithAuth(chatId, senderId);
    await this.messageRepository.save({ chatId, senderId, message });

    if (chat.buyerId === senderId) {
      await this.handleBuyerMessage(chat);
    }
  }

  private async handleBuyerMessage(chat: Chat): Promise<void> {
    const messages = await this.getMessages(chat.id);
    const messageHistory = messages.map((msg) =>
      msg.senderId === chat.buyerId
        ? new HumanMessage(msg.message || '')
        : new AIMessage(msg.message || '')
    );

    const aiResponseText = await this.flockAIService.invoke([
      new SystemMessage(await this.createSystemPrompt(chat)),
      ...messageHistory,
    ]);

    const aiResponseJson = this.jsonService.parseFromCodeBlock<ChatAIResponseDto>(aiResponseText);
    if (!aiResponseJson) {
      throw new BadRequestException('AI 응답을 파싱할 수 없습니다.');
    }

    await this.messageRepository.save({
      chatId: chat.id,
      senderId: chat.sellerId,
      message: aiResponseJson.response || aiResponseText,
    });

    if (aiResponseJson.needsSellerEmail) {
      await this.notifySeller(chat);
    }
  }

  private async createSystemPrompt(chat: Chat): Promise<string> {
    const productAnalysis = await this.productAnalysisRepository.findOne({
      where: { itemId: chat.itemId },
      order: { createdAt: 'DESC' },
    });

    if (!productAnalysis) return this.systemPrompt;

    const analysisText = [
      '## 상품 정보',
      `- 상품명: ${productAnalysis.name}`,
      `- 분석: ${productAnalysis.analysis}`,
      `- 문제점: ${productAnalysis.issues.join(', ')}`,
      `- 장점: ${productAnalysis.positives.join(', ')}`,
      `- 사용감: ${productAnalysis.usageLevel}`,
      `- 가격: ${productAnalysis.recommendedPrice ? `${productAnalysis.recommendedPrice}원` : '없음'}`,
      productAnalysis.priceReason && `- 가격 근거: ${productAnalysis.priceReason}`,
    ]
      .filter(Boolean)
      .join('\n');

    return `${this.systemPrompt}\n\n${analysisText}\n`;
  }

  private async notifySeller(chat: Chat): Promise<void> {
    const seller = await this.userService.findById(chat.sellerId);
    if (!seller?.email) {
      console.warn(`판매자 ${chat.sellerId}의 이메일이 설정되지 않았습니다.`);
      return;
    }

    try {
      const { subject, text } = await this.generateEmailContent(chat);
      await this.emailService.sendEmail(seller.email, subject, text);
    } catch (error) {
      console.error('판매자에게 이메일 전송 실패:', error);
    }
  }

  private async generateEmailContent(chat: Chat): Promise<EmailContentDto> {
    const messages = await this.getMessages(chat.id);
    const chatHistory = messages
      .map(msg => `[${msg.senderId === chat.buyerId ? '구매자' : '판매자'}] ${msg.message}`)
      .join('\n');

    const response = await this.flockAIService.invoke([
      new SystemMessage(this.emailPrompt),
      new HumanMessage(`채팅 ID: ${chat.id}\n아이템 ID: ${chat.itemId}\n\n## 이전 채팅 내용\n${chatHistory}`),
    ]);

    const emailContent = this.jsonService.parseFromCodeBlock<EmailContentDto>(response);
    if (!emailContent?.subject || !emailContent?.text) {
      throw new BadRequestException('이메일 내용 생성에 실패했습니다.');
    }

    return emailContent;
  }

  private async findChatWithAuth(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException('채팅을 찾을 수 없습니다.');
    }
    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      throw new ForbiddenException('이 채팅에 접근할 권한이 없습니다.');
    }
    return chat;
  }

  async getChat(chatId: number, userId: number): Promise<Chat> {
    return this.findChatWithAuth(chatId, userId);
  }

  async getChatMessages(chatId: number, userId: number): Promise<Message[]> {
    await this.findChatWithAuth(chatId, userId);
    return this.getMessages(chatId);
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.chatRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserChatsWithLastMessage(userId: number): Promise<(Chat & { lastMessage: Message | null })[]> {
    const chats = await this.getUserChats(userId);
    
    return Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { chatId: chat.id },
          order: { createdAt: 'DESC' },
        });
        return { ...chat, lastMessage };
      })
    );
  }

  async getChatWithMessages(chatId: number, userId: number) {
    const chat = await this.findChatWithAuth(chatId, userId);
    const messages = await this.getMessages(chatId);
    return { ...chat, messages };
  }
}

