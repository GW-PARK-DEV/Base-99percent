import { Global, Module } from '@nestjs/common';
import { JsonService } from './json.service';

@Global()
@Module({
  providers: [JsonService],
  exports: [JsonService],
})
export class JsonModule {}

