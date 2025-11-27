import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoint } from './entities/user-point.entity';
import { UserPointTotal } from './entities/user-point-total.entity';
import { PointService } from './point.service';
import { PointController } from './point.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoint, UserPointTotal]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  providers: [PointService],
  controllers: [PointController],
  exports: [PointService],
})
export class PointModule {}

