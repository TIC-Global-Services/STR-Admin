import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NewsQueue {
  constructor(@InjectQueue('news') private newsQueue: Queue) {}

  async addNewsJob(data: any) {
    await this.newsQueue.add('send-news', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}