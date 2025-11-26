import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Trade } from './entities/trade.entity';
import { ItemService } from '../item/item.service';
import { UserService } from '../user/user.service';
import { X402Service } from '../x402/x402.service';
import { CreateTradeDto } from './dto/trade.dto';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly itemService: ItemService,
    private readonly userService: UserService,
    private readonly x402Service: X402Service,
    private readonly configService: ConfigService,
  ) {}

  async createTrade(
    buyerId: number,
    dto: CreateTradeDto,
    paymentHeader: string,
    requestUrl: string,
    requestMethod: string,
  ): Promise<Trade> {
    // 아이템 조회
    const item = await this.itemService.findById(dto.itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // 판매자 정보 확인
    const sellerId = item.userId;
    if (sellerId === buyerId) {
      throw new ForbiddenException('자신의 아이템은 구매할 수 없습니다.');
    }

    // 판매자 지갑 주소 확인
    const seller = await this.userService.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('판매자를 찾을 수 없습니다.');
    }
    if (!seller.walletAddress) {
      throw new BadRequestException('판매자의 지갑 주소가 등록되지 않았습니다.');
    }

    // 결제 검증 및 구매자 지갑 주소 추출
    const network = this.configService.get<string>('X402_NETWORK', 'base');
    const paymentConfig = {
      price: dto.price.toString(),
      network,
      recipientAddress: seller.walletAddress,
      description: `아이템 #${dto.itemId} 구매`,
    };

    const isValid = await this.x402Service.verifyPayment(
      paymentHeader,
      requestUrl,
      requestMethod,
      paymentConfig,
    );

    if (!isValid) {
      throw new BadRequestException('결제 검증에 실패했습니다.');
    }

    // 구매자 지갑 주소 추출 및 저장
    const walletAddress = this.x402Service.extractWalletAddress(paymentHeader);
    if (!walletAddress) {
      throw new BadRequestException('결제 정보에서 지갑 주소를 추출할 수 없습니다.');
    }

    const buyer = await this.userService.findById(buyerId);
    if (!buyer) {
      throw new NotFoundException('구매자를 찾을 수 없습니다.');
    }

    // 구매자 지갑 주소가 없으면 추가
    if (!buyer.walletAddress) {
      await this.userService.updateWalletAddress(buyerId, walletAddress);
    }

    // 거래 생성
    const trade = this.tradeRepository.create({
      itemId: dto.itemId,
      buyerId,
      sellerId,
      price: dto.price,
    });

    return this.tradeRepository.save(trade);
  }

  async getPaymentInstructions(
    itemId: number,
    price: number,
    requestUrl: string,
    requestMethod: string,
  ) {
    const item = await this.itemService.findById(itemId);
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // 판매자 지갑 주소 확인
    const seller = await this.userService.findById(item.userId);
    if (!seller) {
      throw new NotFoundException('판매자를 찾을 수 없습니다.');
    }
    if (!seller.walletAddress) {
      throw new BadRequestException('판매자의 지갑 주소가 등록되지 않았습니다.');
    }

    const network = this.configService.get<string>('X402_NETWORK', 'base');
    const paymentConfig = {
      price: price.toString(),
      network,
      recipientAddress: seller.walletAddress,
      description: `아이템 #${itemId} 구매`,
    };

    return this.x402Service.getPaymentInstructions(
      requestUrl,
      requestMethod,
      paymentConfig,
    );
  }
}

