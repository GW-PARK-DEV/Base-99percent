import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoint } from './entities/user-point.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,
  ) {}

  async addPoints(userId: number, amount: number, reason: string): Promise<UserPoint> {
    const userPoint = this.userPointRepository.create({
      userId,
      changeAmount: amount,
      reason,
    });

    return this.userPointRepository.save(userPoint);
  }

  async getUserTotalPoints(userId: number): Promise<number> {
    const result = await this.userPointRepository
      .createQueryBuilder('up')
      .select('SUM(up.changeAmount)', 'total')
      .where('up.userId = :userId', { userId })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }
}

