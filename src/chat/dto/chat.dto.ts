import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description: '채팅할 아이템 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  itemId: number;
}

export class SendMessageDto {
  @ApiProperty({
    description: '메시지 내용',
    example: '이 상품 할인 되나요?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: '채팅 ID' })
  id: number;

  @ApiProperty({ description: '아이템 ID' })
  itemId: number;

  @ApiProperty({ description: '판매자 ID' })
  sellerId: number;

  @ApiProperty({ description: '구매자 ID' })
  buyerId: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

export class MessageResponseDto {
  @ApiProperty({ description: '메시지 ID' })
  id: number;

  @ApiProperty({ description: '채팅 ID' })
  chatId: number;

  @ApiProperty({ description: '발신자 ID' })
  senderId: number;

  @ApiProperty({ description: '메시지 내용' })
  message: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

export class ChatWithMessagesResponseDto extends ChatResponseDto {
  @ApiProperty({ description: '메시지 목록', type: [MessageResponseDto] })
  messages: MessageResponseDto[];
}

