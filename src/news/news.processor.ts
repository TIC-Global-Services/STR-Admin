import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ResendService } from 'src/resend/resend.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('news')
export class NewsProcessor extends WorkerHost {
  constructor(
    private readonly resendService: ResendService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const news = job.data;

    console.log('🚀 Processing news job...');

    const members = await this.prisma.membership.findMany({
      where: { status: 'APPROVED' },
      select: { fullName: true, email: true },
    });

    if (members.length === 0) return;

    const siteUrl = process.env.SITE_URL ?? 'https://silambarasantr.com';

    await this.resendService.sendTemplateBulk(
      members.map((m) => ({
        email: m.email,
        data: { name: m.fullName },
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

    console.log('✅ News emails sent');
  }
}
