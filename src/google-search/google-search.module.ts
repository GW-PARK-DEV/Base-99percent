import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleSearchService } from './google-search.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GoogleSearchService],
  exports: [GoogleSearchService],
})
export class GoogleSearchModule {}
