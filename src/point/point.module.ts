import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoint } from './entities/user-point.entity';
import { UserPointTotal } from './entities/user-point-total.entity';
import { PointService } from './point.service';
import { PointController } from './point.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoint, UserPointTotal]),
    UserModule,
  ],
  providers: [PointService],
  controllers: [PointController],
  exports: [PointService],
})
export class PointModule {}

