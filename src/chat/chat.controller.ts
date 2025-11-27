import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ChatService } from './chat.service';
import {
  CreateChatDto,
  SendMessageDto,
  ChatResponseDto,
  MessageResponseDto,
  ChatWithMessagesResponseDto,
  SuccessResponseDto,
} from './dto/chat.dto';

@ApiTags('chat')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  private getUserId(req: any): number {
    return req.user.userId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 생성' })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async createChat(@Body() dto: CreateChatDto, @Request() req: any): Promise<SuccessResponseDto> {
    await this.chatService.createChat(await this.getUserId(req), dto.itemId);
    return { success: true };
  }

  @Post(':chatId/messages')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메시지 전송' })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async sendMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ): Promise<SuccessResponseDto> {
    await this.chatService.sendMessage(chatId, await this.getUserId(req), dto.message);
    return { success: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자의 채팅 목록 조회' })
  @ApiResponse({ status: 200, type: [ChatResponseDto] })
  @ApiResponse({ status: 401 })
  async getUserChats(@Request() req: any): Promise<ChatResponseDto[]> {
    const chats = await this.chatService.getUserChatsWithLastMessage(await this.getUserId(req));
    return chats.map(({ id, itemId, sellerId, buyerId, createdAt, lastMessage }) => ({
      id,
      itemId,
      sellerId,
      buyerId,
      createdAt,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        chatId: lastMessage.chatId,
        senderId: lastMessage.senderId,
        message: lastMessage.message,
        createdAt: lastMessage.createdAt,
      } : null,
    }));
  }

  @Get(':chatId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 상세 조회' })
  @ApiResponse({ status: 200, type: ChatWithMessagesResponseDto })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async getChatWithMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<ChatWithMessagesResponseDto> {
    const chatWithMessages = await this.chatService.getChatWithMessages(chatId, await this.getUserId(req));
    return {
      ...chatWithMessages,
      messages: chatWithMessages.messages.map(({ id, chatId, senderId, message, createdAt }) => ({
        id,
        chatId,
        senderId,
        message,
        createdAt,
      })),
    };
  }

  @Get(':chatId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 메시지 목록 조회' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async getChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatService.getChatMessages(chatId, await this.getUserId(req));
    return messages.map(({ id, chatId, senderId, message, createdAt }) => ({
      id,
      chatId,
      senderId,
      message,
      createdAt,
    }));
  }
}

