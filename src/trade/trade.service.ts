import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Trade } from './entities/trade.entity';
import { ItemService } from '../item/item.service';
import { UserService } from '../user/user.service';
import { X402Service } from '../x402/x402.service';
import { PointService } from '../point/point.service';
import { ProductAnalysisService } from '../product-analysis/product-analysis.service';
import { CreateTradeDto } from './dto/trade.dto';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly itemService: ItemService,
    private readonly userService: UserService,
    private readonly x402Service: X402Service,
    private readonly pointService: PointService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ProductAnalysisService))
    private readonly productAnalysisService: ProductAnalysisService,
  ) {}

  private async getItemPrice(itemId: number): Promise<number> {
    const item = await this.itemService.findById(itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    const analysis = await this.productAnalysisService.findByItemId(itemId);
    if (!analysis?.recommendedPrice) {
      throw new BadRequestException('상품 분석이 없거나 가격이 설정되지 않았습니다.');
    }

    return analysis.recommendedPrice;
  }

  private createPaymentConfig(itemId: number, price: number) {
    return {
      price: `$${(price / 1000000).toFixed(6)}`,
      network: this.configService.get<string>('X402_NETWORK')!,
      recipientAddress: this.configService.get<string>('X402_SERVER_WALLET_ADDRESS')!,
      description: `아이템 #${itemId} 구매`,
    };
  }

  async createTrade(
    buyerId: number,
    dto: CreateTradeDto,
    paymentHeader: string,
    requestUrl: string,
    requestMethod: string,
  ): Promise<Trade> {
    const item = await this.itemService.findById(dto.itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    const price = await this.getItemPrice(dto.itemId);
    const sellerId = item.userId;

    if (sellerId === buyerId) {
      throw new ForbiddenException('자신의 아이템은 구매할 수 없습니다.');
    }

    if (!(await this.userService.findById(sellerId))) {
      throw new NotFoundException('판매자를 찾을 수 없습니다.');
    }

    const paymentConfig = this.createPaymentConfig(dto.itemId, price);
    const isValid = await this.x402Service.verifyPayment(paymentHeader, requestUrl, requestMethod, paymentConfig);

    if (!isValid) {
      throw new BadRequestException('결제 검증에 실패했습니다.');
    }

    const trade = await this.tradeRepository.save({
      itemId: dto.itemId,
      buyerId,
      sellerId,
      price,
    });

    await this.pointService.addPoints(sellerId, price, `아이템 #${dto.itemId} 판매`);
    await this.itemService.markAsSold(dto.itemId);

    return trade;
  }

  async getPaymentInstructions(itemId: number, requestUrl: string, requestMethod: string) {
    const price = await this.getItemPrice(itemId);
    const paymentConfig = this.createPaymentConfig(itemId, price);
    return this.x402Service.getPaymentInstructions(requestUrl, requestMethod, paymentConfig);
  }
}

