import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  itemId: number;
}

export class SendMessageDto {
  @ApiProperty({ example: '이 상품 구매 가능한가요?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  chatId: number;

  @ApiProperty({ example: 1 })
  senderId: number;

  @ApiProperty({ example: '이 상품 할인 되나요?' })
  message: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: true, required: false })
  isMine?: boolean;
}

export class ChatResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  itemId: number;

  @ApiProperty({ example: 1 })
  sellerId: number;

  @ApiProperty({ example: 2 })
  buyerId: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: MessageResponseDto, nullable: true, required: false })
  lastMessage?: MessageResponseDto | null;
}

export class ChatWithMessagesResponseDto extends ChatResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class ChatAIResponseDto {
  @ApiProperty({ example: '안녕하세요, 도와드리겠습니다.' })
  response: string;

  @ApiProperty({ example: false })
  needsSellerEmail: boolean;
}

export class EmailContentDto {
  @ApiProperty({ example: '구매자 문의가 도착했습니다' })
  subject: string;

  @ApiProperty({ example: '구매자님으로부터 문의가 도착했습니다...' })
  text: string;
}