import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { ItemModule } from '../item/item.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade]),
    ItemModule,
    UserModule,
  ],
  providers: [TradeService],
  controllers: [TradeController],
  exports: [TradeService],
})
export class TradeModule {}

