import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoint } from './entities/user-point.entity';
import { UserPointTotal } from './entities/user-point-total.entity';
import { PointService } from './point.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPoint, UserPointTotal])],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}

