import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { QuickAuthGuard } from '../quick-auth/quick-auth.guard';
import { TradeService } from './trade.service';
import { UserService } from '../user/user.service';
import { CreateTradeDto, TradeResponseDto } from './dto/trade.dto';

@ApiTags('trade')
@Controller('trades')
export class TradeController {
  constructor(
    private readonly tradeService: TradeService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @UseGuards(QuickAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '거래 생성 및 결제 처리' })
  @ApiHeader({
    name: 'X-Payment',
    description: 'X402 결제 헤더',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: '거래 생성 성공',
    type: TradeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 결제 검증 실패',
  })
  @ApiResponse({
    status: 401,
    description: '인증 토큰이 없거나 유효하지 않음',
  })
  @ApiResponse({
    status: 403,
    description: '자신의 아이템은 구매할 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '아이템을 찾을 수 없음',
  })
  @ApiResponse({
    status: 402,
    description: '결제가 필요함 (결제 instructions 포함)',
  })
  async createTrade(
    @Body() dto: CreateTradeDto,
    @Request() req: any,
  ): Promise<TradeResponseDto> {
    const paymentHeader = req.headers['x-payment'] as string;
    
    if (!paymentHeader) {
      // 결제 instructions 반환
      const instructions = await this.tradeService.getPaymentInstructions(
        dto.itemId,
        dto.price,
        req.url,
        req.method,
      );
      throw new BadRequestException(instructions);
    }

    const user = await this.userService.findOrCreate(req.user.fid);
    
    const trade = await this.tradeService.createTrade(
      user.id,
      dto,
      paymentHeader,
      req.url,
      req.method,
    );

    return {
      id: trade.id,
      itemId: trade.itemId,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId,
      price: trade.price,
      createdAt: trade.createdAt,
      updatedAt: trade.updatedAt,
    };
  }
}

