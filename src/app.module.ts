import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { X402Module } from './x402/x402.module';

@Module({
  imports: [
    X402Module.forRoot({
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
