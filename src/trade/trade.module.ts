import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { ItemModule } from '../item/item.module';
import { UserModule } from '../user/user.module';
import { PointModule } from '../point/point.module';
import { ProductAnalysisModule } from '../product-analysis/product-analysis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade]),
    forwardRef(() => ItemModule),
    forwardRef(() => UserModule),
    forwardRef(() => PointModule),
    forwardRef(() => ProductAnalysisModule),
    forwardRef(() => AuthModule),
  ],
  providers: [TradeService],
  controllers: [TradeController],
  exports: [TradeService],
})
export class TradeModule {}

