import { Injectable } from '@nestjs/common';
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
}