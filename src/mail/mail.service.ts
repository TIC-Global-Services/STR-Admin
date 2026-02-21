import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({ to, subject, html });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendMemberConfirmation(member: {
    name: string;
    email: string;
    uniqueMemberId: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: member.email,
        subject: '🎬 Welcome to the STR Fan Community – Application Received!',
        template: 'member-confirmation',
        context: {
          name: member.name,
          memberId: member.uniqueMemberId,
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Member confirmation email error:', error);
      throw error;
    }
  }

  async sendAdminNotification(
    adminEmail: string,
    member: {
      name: string;
      email: string;
      phone: string;
      uniqueMemberId: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: adminEmail,
        subject: `🔔 New STR Membership Application – ${member.name}`,
        template: 'admin-notification',
        context: {
          name: member.name,
          email: member.email,
          phone: member.phone,
          memberId: member.uniqueMemberId,
          receivedAt: new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'long',
            timeStyle: 'short',
          }),
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Admin notification email error:', error);
      throw error;
    }
  }

  async sendMembershipApproved(member: {
    name: string;
    email: string;
    uniqueMemberId: string | null;
  }) {
    try {
      await this.mailerService.sendMail({
        to: member.email,
        subject: '🎉 Membership Approved – Welcome to the STR Family!',
        template: 'membership-approved',
        context: {
          name: member.name,
          memberId: member.uniqueMemberId ?? 'N/A',
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Membership approved email error:', error);
      throw error;
    }
  }

  async sendMembershipRejected(member: {
    name: string;
    email: string;
    reason: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: member.email,
        subject: 'Update on Your STR Membership Application',
        template: 'membership-rejected',
        context: {
          name: member.name,
          reason: member.reason,
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Membership rejected email error:', error);
      throw error;
    }
  }

  async sendNewsAlert(
    members: { name: string; email: string }[],
    news: { title: string; slug: string; excerpt?: string | null },
  ) {
    const results = await Promise.allSettled(
      members.map((member) =>
        this.mailerService.sendMail({
          to: member.email,
          subject: `🎬 New Update from STR – ${news.title}`,
          template: 'news-alert',
          context: {
            name: member.name,
            title: news.title,
            excerpt: news.excerpt ?? '',
            slug: news.slug,
            year: new Date().getFullYear(),
          },
        }),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      console.error(`News alert: ${failed}/${members.length} emails failed`);
    }
  }
}
