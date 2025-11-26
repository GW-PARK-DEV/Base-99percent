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
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';
import {
  CreateChatDto,
  SendMessageDto,
  ChatResponseDto,
  MessageResponseDto,
  ChatWithMessagesResponseDto,
} from './dto/chat.dto';

@ApiTags('chat')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @UseGuards(QuickAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 생성' })
  @ApiResponse({
    status: 201,
    description: '채팅 생성 성공',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  @ApiResponse({
    status: 403,
    description: '자신의 아이템에는 채팅을 시작할 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '아이템을 찾을 수 없음',
  })
  async createChat(@Body() dto: CreateChatDto, @Request() req: any): Promise<ChatResponseDto> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const chat = await this.chatService.createChat(user.id, dto.itemId);

    return {
      id: chat.id,
      itemId: chat.itemId,
      sellerId: chat.sellerId,
      buyerId: chat.buyerId,
      createdAt: chat.createdAt,
    };
  }

  @Post(':chatId/messages')
  @UseGuards(QuickAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메시지 전송' })
  @ApiResponse({
    status: 201,
    description: '메시지 전송 성공',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  @ApiResponse({
    status: 403,
    description: '이 채팅에 메시지를 보낼 권한이 없음',
  })
  @ApiResponse({
    status: 404,
    description: '채팅을 찾을 수 없음',
  })
  async sendMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ): Promise<{ message: MessageResponseDto; aiResponse?: MessageResponseDto; needsSellerResponse: boolean }> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const result = await this.chatService.sendMessage(chatId, user.id, dto.message);

    const response: any = {
      message: {
        id: result.message.id,
        chatId: result.message.chatId,
        senderId: result.message.senderId,
        message: result.message.message,
        createdAt: result.message.createdAt,
      },
      needsSellerResponse: result.needsSellerResponse,
    };

    if (result.aiResponse) {
      response.aiResponse = {
        id: result.aiResponse.id,
        chatId: result.aiResponse.chatId,
        senderId: result.aiResponse.senderId,
        message: result.aiResponse.message,
        createdAt: result.aiResponse.createdAt,
      };
    }

    return response;
  }

  @Get()
  @UseGuards(QuickAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자의 채팅 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '채팅 목록 조회 성공',
    type: [ChatResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  async getUserChats(@Request() req: any): Promise<ChatResponseDto[]> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const chats = await this.chatService.getUserChats(user.id);

    return chats.map((chat) => ({
      id: chat.id,
      itemId: chat.itemId,
      sellerId: chat.sellerId,
      buyerId: chat.buyerId,
      createdAt: chat.createdAt,
    }));
  }

  @Get(':chatId')
  @UseGuards(QuickAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 상세 조회 (메시지 포함)' })
  @ApiResponse({
    status: 200,
    description: '채팅 상세 조회 성공',
    type: ChatWithMessagesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  @ApiResponse({
    status: 403,
    description: '이 채팅에 접근할 권한이 없음',
  })
  @ApiResponse({
    status: 404,
    description: '채팅을 찾을 수 없음',
  })
  async getChatWithMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<ChatWithMessagesResponseDto> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const chatWithMessages = await this.chatService.getChatWithMessages(chatId, user.id);

    return {
      id: chatWithMessages.id,
      itemId: chatWithMessages.itemId,
      sellerId: chatWithMessages.sellerId,
      buyerId: chatWithMessages.buyerId,
      createdAt: chatWithMessages.createdAt,
      messages: chatWithMessages.messages.map((msg) => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        message: msg.message,
        createdAt: msg.createdAt,
      })),
    };
  }

  @Get(':chatId/messages')
  @UseGuards(QuickAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채팅 메시지 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '메시지 목록 조회 성공',
    type: [MessageResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  @ApiResponse({
    status: 403,
    description: '이 채팅에 접근할 권한이 없음',
  })
  @ApiResponse({
    status: 404,
    description: '채팅을 찾을 수 없음',
  })
  async getChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: any,
  ): Promise<MessageResponseDto[]> {
    const user = await this.userService.findOrCreate(req.user.fid);
    const messages = await this.chatService.getChatMessages(chatId, user.id);

    return messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      message: msg.message,
      createdAt: msg.createdAt,
    }));
  }
}

