import { Injectable } from '@nestjs/common';
import { NewsRepository } from './repositories/news.repository';
import { AuditService } from 'src/audit/audit.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly repo: NewsRepository,
    private readonly audit: AuditService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateNewsDto, authorId: string) {
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const data: any = {
      ...dto,
      slug,
      authorId,
    };

    if (dto.isPublished === true) {
      data.publishedAt = new Date();
    }

    const news = await this.repo.create(data);

    await this.audit.log({
      userId: authorId,
      action: 'NEWS_CREATE',
      entity: 'News',
      entityId: news.id,
    });

    if (dto.isPublished === true) {
      await this.audit.log({
        userId: authorId,
        action: 'NEWS_PUBLISH',
        entity: 'News',
        entityId: news.id,
      });

      this.sendNewsAlertToMembers(news).catch((err) =>
        console.error('News alert emails failed:', err),
      );
    }

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

      this.sendNewsAlertToMembers({ id, ...data }).catch((err) =>
        console.error('News alert emails failed:', err),
      );
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

  private async sendNewsAlertToMembers(news: {
    title: string;
    slug: string;
    coverImage: string | null;
    excerpt?: string | null;
  }) {
    const members = await this.prisma.membership.findMany({
      where: { status: 'APPROVED' },
      select: { fullName: true, email: true },
    });

    if (members.length === 0) return;

    await this.mailService.sendNewsAlert(
      members.map((m) => ({ name: m.fullName, email: m.email })),
      news,
    );
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  findBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  findAllAdmin() {
    return this.repo.findAllAdmin();
  }

  findPublished() {
    return this.repo.findPublished();
  }
}
