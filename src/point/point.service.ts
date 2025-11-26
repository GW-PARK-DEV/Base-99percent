import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoint } from './entities/user-point.entity';
import { UserPointTotal } from './entities/user-point-total.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,
    @InjectRepository(UserPointTotal)
    private readonly userPointTotalRepository: Repository<UserPointTotal>,
  ) {}

  async addPoints(userId: number, amount: number, reason: string): Promise<UserPoint> {
    return this.userPointRepository.save({ userId, changeAmount: amount, reason });
  }

  async getUserTotalPoints(userId: number): Promise<number> {
    const result = await this.userPointTotalRepository.findOne({
      where: { userId },
    });
    return result?.totalPoints || 0;
  }

  async withdrawPoints(userId: number, amount: number, reason: string): Promise<UserPoint> {
    const totalPoints = await this.getUserTotalPoints(userId);
    
    if (totalPoints < amount) {
      throw new BadRequestException('포인트가 부족합니다.');
    }

    if (amount <= 0) {
      throw new BadRequestException('출금할 포인트는 0보다 커야 합니다.');
    }

    // 포인트 차감 (음수로 저장)
    return this.userPointRepository.save({
      userId,
      changeAmount: -amount,
      reason: reason || '포인트 출금',
    });
  }
}