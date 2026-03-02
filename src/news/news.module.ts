import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsPublicController } from './news-public.controller';
import { NewsRepository } from './repositories/news.repository';
import { AuditService } from 'src/audit/audit.service';
import { BullModule } from '@nestjs/bullmq';
import { NewsQueue } from './news.queue';
import { NewsProcessor } from './news.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'news',
    }),
  ],
  controllers: [NewsController, NewsPublicController],
  providers: [NewsService, NewsRepository, AuditService, NewsQueue, NewsProcessor],
})
export class NewsModule {}
