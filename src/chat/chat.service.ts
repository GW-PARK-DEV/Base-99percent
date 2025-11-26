import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
    const prompt = readFileSync(join(promptsDir, 'chat.md'), 'utf-8');
    const example = this.jsonService.readFromDir(promptsDir, 'chat.json');
    this.systemPrompt = `${prompt}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``;

    const emailPromptText = readFileSync(join(promptsDir, 'email.md'), 'utf-8');
    const emailExample = this.jsonService.readFromDir(promptsDir, 'email.json');
    this.emailPrompt = `${emailPromptText}\n\n응답 형식 예시:\n\`\`\`json\n${JSON.stringify(emailExample, null, 2)}\n\`\`\``;
  }

  async createChat(buyerId: number, itemId: number): Promise<Chat> {
    const item = await this.itemService.findById(itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    const sellerId = item.userId;
    if (sellerId === buyerId) {
      throw new ForbiddenException('자신의 아이템에는 채팅을 시작할 수 없습니다.');
    }

    const existingChat = await this.chatRepository.findOne({
      where: { itemId, buyerId, sellerId },
    });

    if (existingChat) {
      return existingChat;
    }

    return this.chatRepository.save({ itemId, buyerId, sellerId });
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    message: string,
  ): Promise<{ message: Message; aiResponse?: Message; needsSellerResponse: boolean }> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException('채팅을 찾을 수 없습니다.');
    }

    if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
      throw new ForbiddenException('이 채팅에 메시지를 보낼 권한이 없습니다.');
    }

    const savedMessage = await this.messageRepository.save({ chatId, senderId, message });

    if (chat.buyerId === senderId) {
      return this.handleBuyerMessage(chat, savedMessage);
    }

    return { message: savedMessage, needsSellerResponse: false };
  }

  private async handleBuyerMessage(
    chat: Chat,
    buyerMessage: Message,
  ): Promise<{ message: Message; aiResponse?: Message; needsSellerResponse: boolean }> {
    const previousMessages = await this.messageRepository.find({
      where: { chatId: chat.id },
      order: { createdAt: 'ASC' },
    });

    const systemPrompt = await this.createSystemPrompt(chat);

    const messageHistory = previousMessages.map((msg) =>
      msg.senderId === chat.buyerId
        ? new HumanMessage(msg.message || '')
        : new AIMessage(msg.message || '')
    );

    const aiResponseText = await this.flockAIService.invoke([
      new SystemMessage(systemPrompt),
      ...messageHistory,
    ]);

    const aiResponseJson = this.jsonService.parseFromCodeBlock<ChatAIResponseDto>(aiResponseText);
    if (!aiResponseJson) {
      throw new BadRequestException('AI 응답을 파싱할 수 없습니다.');
    }

    const savedAiResponse = await this.messageRepository.save({
      chatId: chat.id,
      senderId: chat.sellerId,
      message: aiResponseJson.response || aiResponseText,
    });

    if (aiResponseJson.needsSellerEmail) {
      await this.notifySeller(chat);
    }

    return {
      message: buyerMessage,
      aiResponse: savedAiResponse,
      needsSellerResponse: aiResponseJson.needsSellerEmail,
    };
  }

  private async createSystemPrompt(chat: Chat): Promise<string> {
    const [productAnalysis, otherChats] = await Promise.all([
      this.productAnalysisRepository.findOne({
        where: { itemId: chat.itemId },
        order: { createdAt: 'DESC' },
      }),
      this.chatRepository.find({ where: { itemId: chat.itemId } }),
    ]);

    const otherChatIds = otherChats.filter(c => c.id !== chat.id).map(c => c.id);
    const previousChatMessages = otherChatIds.length > 0
      ? await this.messageRepository.find({
          where: { chatId: In(otherChatIds) },
          order: { createdAt: 'DESC' },
          take: 10,
        })
      : [];

    const contextParts: string[] = [];

    if (productAnalysis) {
      contextParts.push(`## 상품 분석 정보
- 상품명: ${productAnalysis.name}
- 분석: ${productAnalysis.analysis}
- 문제점: ${productAnalysis.issues.join(', ')}
- 장점: ${productAnalysis.positives.join(', ')}
- 사용감: ${productAnalysis.usageLevel}
- 권장 가격: ${productAnalysis.recommendedPrice ? `${productAnalysis.recommendedPrice}원` : '없음'}
${productAnalysis.priceReason ? `- 가격 근거: ${productAnalysis.priceReason}` : ''}`);
    }

    if (previousChatMessages.length > 0) {
      const chatHistory = [...previousChatMessages]
        .reverse()
        .map(msg => `[${msg.senderId === chat.buyerId ? '구매자' : '판매자'}] ${msg.message}`)
        .join('\n');
      contextParts.push(`## 이전 채팅 내용\n${chatHistory}`);
    }

    return contextParts.length > 0
      ? `${this.systemPrompt}\n\n## 컨텍스트 정보\n${contextParts.join('\n\n')}\n`
      : this.systemPrompt;
  }

  private async notifySeller(chat: Chat): Promise<void> {
    const seller = await this.userService.findById(chat.sellerId);
    if (!seller?.email) {
      console.warn(`판매자 ${chat.sellerId}의 이메일이 설정되지 않았습니다.`);
      return;
    }

    try {
      const emailContent = await this.generateEmailContent(chat);
      await this.emailService.sendEmail(seller.email, emailContent.subject, emailContent.text);
    } catch (error) {
      console.error('판매자에게 이메일 전송 실패:', error);
    }
  }

  private async generateEmailContent(chat: Chat): Promise<EmailContentDto> {
    const messages = await this.messageRepository.find({
      where: { chatId: chat.id },
      order: { createdAt: 'ASC' },
    });

    const chatHistory = messages
      .map(msg => `[${msg.senderId === chat.buyerId ? '구매자' : '판매자'}] ${msg.message}`)
      .join('\n');

    const contextPrompt = `채팅 ID: ${chat.id}\n아이템 ID: ${chat.itemId}\n\n채팅 내역:\n${chatHistory}`;

    const response = await this.flockAIService.invoke([
      new SystemMessage(this.emailPrompt),
      new HumanMessage(contextPrompt),
    ]);

    const emailContent = this.jsonService.parseFromCodeBlock<EmailContentDto>(response);
    
    if (!emailContent || !emailContent.subject || !emailContent.text) {
      throw new BadRequestException('이메일 내용 생성에 실패했습니다.');
    }

    return emailContent;
  }

  async getChat(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException('채팅을 찾을 수 없습니다.');
    }

    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      throw new ForbiddenException('이 채팅에 접근할 권한이 없습니다.');
    }

    return chat;
  }

  async getChatMessages(chatId: number, userId: number): Promise<Message[]> {
    await this.getChat(chatId, userId);
    return this.messageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.chatRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async getChatWithMessages(chatId: number, userId: number) {
    const chat = await this.getChat(chatId, userId);
    const messages = await this.getChatMessages(chatId, userId);

    return {
      ...chat,
      messages,
    };
  }
}

