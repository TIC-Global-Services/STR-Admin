import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(data: { email: string; otp: string }) {
  try {
    await this.mailerService.sendMail({
      to: data.email,
      subject: '🔐 STR Membership Email Verification Code',
      html: `
        <div style="
          font-family: 'Segoe UI', Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 40px 20px;
        ">
          <div style="
            max-width: 500px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 40px 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            text-align: center;
          ">
            
            <h2 style="
              margin: 0 0 10px;
              font-size: 22px;
              color: #111;
              letter-spacing: 1px;
            ">
              STR Fan Community
            </h2>

            <p style="
              font-size: 14px;
              color: #555;
              margin-bottom: 30px;
            ">
              Please use the verification code below to complete your membership registration.
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background: #000;
              color: #fff;
              padding: 15px 20px;
              border-radius: 10px;
              display: inline-block;
              margin-bottom: 25px;
            ">
              ${data.otp}
            </div>

            <p style="
              font-size: 13px;
              color: #666;
              margin-bottom: 10px;
            ">
              ⏳ This OTP is valid for <strong>5 minutes</strong>.
            </p>

            <p style="
              font-size: 12px;
              color: #999;
              margin-top: 25px;
            ">
              If you did not request this verification, you can safely ignore this email.
            </p>

            <hr style="
              border: none;
              border-top: 1px solid #eee;
              margin: 30px 0;
            " />

            <p style="
              font-size: 11px;
              color: #aaa;
            ">
              © ${new Date().getFullYear()} STR Fan Community. All rights reserved.
            </p>

          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('OTP email send error:', error);
    throw error;
  }
}

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
    news: {
      title: string;
      slug: string;
      summary?: string | null;
      coverImage?: string | null;
      publishedAt?: Date | null;
    },
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
            summary: news.summary ?? '',
            slug: news.slug,
            coverImage:
              news.coverImage ?? 'https://silambarasantr.com/default-news.jpg',
            date: news.publishedAt
              ? news.publishedAt.toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date().toLocaleDateString('en-IN'),
            siteUrl: process.env.SITE_URL ?? 'https://silambarasantr.com',
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
