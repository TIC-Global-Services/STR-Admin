import { Injectable } from '@nestjs/common';
import { NewsRepository } from './repositories/news.repository';
import { AuditService } from 'src/audit/audit.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/resend/resend.service';
import { NewsQueue } from './news.queue';

@Injectable()
export class NewsService {
  constructor(
    private readonly repo: NewsRepository,
    private readonly audit: AuditService,
    private readonly resendService: ResendService,
    private readonly prisma: PrismaService,
    private readonly newsQueue: NewsQueue,
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

      await this.newsQueue.addNewsJob(news);
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

      await this.newsQueue.addNewsJob({ ...dto, id });
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
    console.log('📢 Sending personalized news alert...');

    const members = await this.prisma.membership.findMany({
      where: { status: 'APPROVED' },
      select: { fullName: true, email: true },
    });

    if (members.length === 0) return;

    console.log('Members found:', members.length);

    const siteUrl = process.env.SITE_URL ?? 'https://silambarasantr.com';

    await this.resendService.sendTemplateBulk(
      members.map((m) => ({
        email: m.email,
        data: {
          name: m.fullName,
        },
      })),
      `🎬 New Update – ${news.title}`,
      (data) => `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Vanakkam ${data.name} 👋</h2>

        <h3>${news.title}</h3>

        <p>${news.excerpt ?? ''}</p>

        ${
          news.coverImage
            ? `<img src="${news.coverImage}" 
                 style="max-width:100%; border-radius:10px;" />`
            : ''
        }

        <br/><br/>

        <a href="${siteUrl}/news/${news.slug}"
           style="background:#000;color:#fff;
                  padding:10px 20px;
                  border-radius:8px;
                  text-decoration:none;">
          Read Full Update
        </a>

        <hr style="margin-top:30px;" />

        <p style="font-size:12px;color:#777;">
          © ${new Date().getFullYear()} STR Fan Community
        </p>
      </div>
    `,
    );

    console.log('✅ Personalized Resend bulk executed');
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
