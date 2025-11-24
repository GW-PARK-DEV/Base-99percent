import { Global, Module } from '@nestjs/common';
import { FlockAIService } from './flock-ai.service';

@Global()
@Module({
  providers: [FlockAIService],
  exports: [FlockAIService],
})
export class FlockAIModule {}