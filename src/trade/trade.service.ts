import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Trade } from './entities/trade.entity';
import { ItemService } from '../item/item.service';
import { UserService } from '../user/user.service';
import { X402Service } from '../x402/x402.service';
import { PointService } from '../point/point.service';
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

    // 판매자 존재 확인
    const seller = await this.userService.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('판매자를 찾을 수 없습니다.');
    }

    // 서버 지갑 주소 가져오기
    const serverWalletAddress = this.configService.get<string>('X402_SERVER_WALLET_ADDRESS');
    if (!serverWalletAddress) {
      throw new BadRequestException('서버 지갑 주소가 설정되지 않았습니다.');
    }

    // 결제 검증
    const network = this.configService.get<string>('X402_NETWORK', 'base-sepolia');
    const paymentConfig = {
      price: `$${(dto.price / 1000000).toFixed(6)}`, // price를 달러로 변환 (예: 1000000 = $1.000000)
      network,
      recipientAddress: serverWalletAddress,
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

    // 거래 생성
    const trade = this.tradeRepository.create({
      itemId: dto.itemId,
      buyerId,
      sellerId,
      price: dto.price,
    });

    const savedTrade = await this.tradeRepository.save(trade);

    // 판매자 포인트 증가
    await this.pointService.addPoints(
      sellerId,
      dto.price,
      `아이템 #${dto.itemId} 판매`,
    );

    return savedTrade;
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

    // 서버 지갑 주소 가져오기
    const serverWalletAddress = this.configService.get<string>('X402_SERVER_WALLET_ADDRESS');
    if (!serverWalletAddress) {
      throw new BadRequestException('서버 지갑 주소가 설정되지 않았습니다.');
    }

    const network = this.configService.get<string>('X402_NETWORK', 'base-sepolia');
    const paymentConfig = {
      price: `$${(price / 1000000).toFixed(6)}`, // price를 달러로 변환
      network,
      recipientAddress: serverWalletAddress,
      description: `아이템 #${itemId} 구매`,
    };

    return this.x402Service.getPaymentInstructions(
      requestUrl,
      requestMethod,
      paymentConfig,
    );
  }
}

