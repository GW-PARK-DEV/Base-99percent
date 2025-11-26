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
}

export class ChatWithMessagesResponseDto extends ChatResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}