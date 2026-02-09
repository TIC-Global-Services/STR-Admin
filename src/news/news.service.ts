import { Injectable } from '@nestjs/common';
import { NewsRepository } from './repositories/news.repository';
import { AuditService } from 'src/audit/audit.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly repo: NewsRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateNewsDto, authorId: string) {
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const news = await this.repo.create({
      ...dto,
      slug,
      authorId,
    });

    await this.audit.log({
      userId: authorId,
      action: 'NEWS_CREATE',
      entity: 'News',
      entityId: news.id,
    });

    return news;
  }

  async update(id: string, dto: UpdateNewsDto, userId: string) {
    const data: any = { ...dto };

    if (dto.isPublished === true) {
      data.publishedAt = new Date();
      await this.audit.log({
        userId,
        action: 'NEWS_PUBLISH',
        entity: 'News',
        entityId: id,
      });
    }

    if (dto.isPublished === false) {
      data.publishedAt = null;
      await this.audit.log({
        userId,
        action: 'NEWS_UNPUBLISH',
        entity: 'News',
        entityId: id,
      });
    }

    return this.repo.update(id, data);
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  findAllAdmin() {
    return this.repo.findAllAdmin();
  }

  findPublished() {
    return this.repo.findPublished();
  }
}
