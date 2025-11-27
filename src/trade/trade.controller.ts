import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TradeService } from './trade.service';
import { CreateTradeDto, TradeResponseDto } from './dto/trade.dto';

@ApiTags('trade')
@Controller('trades')
export class TradeController {
  constructor(
    private readonly tradeService: TradeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: '거래 생성 및 결제 처리' })
  @ApiHeader({ name: 'X-Payment', required: true })
  @ApiResponse({ status: 201, type: TradeResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 402 })
  async createTrade(@Body() dto: CreateTradeDto, @Request() req: any): Promise<TradeResponseDto> {
    const paymentHeader = req.headers['x-payment'] as string;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!paymentHeader) {
      const instructions = await this.tradeService.getPaymentInstructions(dto.itemId, fullUrl, req.method);
      throw new HttpException(instructions, HttpStatus.PAYMENT_REQUIRED);
    }

    const trade = await this.tradeService.createTrade(req.user.userId, dto, paymentHeader, fullUrl, req.method);

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

