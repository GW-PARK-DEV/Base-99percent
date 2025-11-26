import { Controller, Post, Body, UseGuards, Request, BadRequestException, HttpStatus, HttpCode } from '@nestjs/common';
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
  @ApiHeader({ name: 'X-Payment', required: true })
  @ApiResponse({ status: 201, type: TradeResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 402 })
  async createTrade(@Body() dto: CreateTradeDto, @Request() req: any): Promise<TradeResponseDto> {
    const paymentHeader = req.headers['x-payment'] as string;

    if (!paymentHeader) {
      const instructions = await this.tradeService.getPaymentInstructions(dto.itemId, req.url, req.method);
      throw new BadRequestException(instructions);
    }

    const user = await this.userService.findOrCreate(req.user.fid);
    const trade = await this.tradeService.createTrade(user.id, dto, paymentHeader, req.url, req.method);

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

