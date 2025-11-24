import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queues = new Map<string, Queue>();

  constructor(private readonly redisService: RedisService) {}

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: this.redisService.getClient() }));
    }
    return this.queues.get(name)!;
  }

  onModuleDestroy() {
    for (const queue of this.queues.values()) {
      queue.close();
    }
  }
}
