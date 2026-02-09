import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const MEMBERSHIP_DIMENSIONS = {
  state: Prisma.sql`"state"`,
  district: Prisma.sql`"district"`,
  zone: Prisma.sql`"zone"`,
  bloodGroup: Prisma.sql`"bloodGroup"`,
  occupation: Prisma.sql`"occupation"`,
} as const;

type MembershipDimension = keyof typeof MEMBERSHIP_DIMENSIONS;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // MEMBERSHIP ANALYTICS
  // ======================================================
  async membershipAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      total,
      pending,
      approved,
      rejected,
      todayCount,
      last7Count,
      last30Count,
      daily,
    ] = await Promise.all([
      this.prisma.membership.count(),
      this.prisma.membership.count({ where: { status: 'PENDING' } }),
      this.prisma.membership.count({ where: { status: 'APPROVED' } }),
      this.prisma.membership.count({ where: { status: 'REJECTED' } }),
      this.prisma.membership.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.membership.count({
        where: { createdAt: { gte: last7Days } },
      }),
      this.prisma.membership.count({
        where: { createdAt: { gte: last30Days } },
      }),
      this.prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "Membership"
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    return {
      summary: {
        total,
        pending,
        approved,
        rejected,
      },
      trends: {
        today: todayCount,
        last7Days: last7Count,
        last30Days: last30Count,
      },
      daily,
    };
  }

  // ======================================================
  // MEMBERSHIP – DIMENSION ANALYTICS
  // ======================================================
  async membershipDimensions() {
    const [state, district, zone, bloodGroup, occupation] = await Promise.all([
      this.groupBy('state'),
      this.groupBy('district'),
      this.groupBy('zone'),
      this.groupBy('bloodGroup'),
      this.groupBy('occupation'),
    ]);

    return {
      state,
      district,
      zone,
      bloodGroup,
      occupation,
    };
  }

  /* ======================================================
     HELPER – SAFE GROUP BY
  ====================================================== */
  private async groupBy(field: MembershipDimension) {
    const column = MEMBERSHIP_DIMENSIONS[field];

    return this.prisma.$queryRaw<{ label: string; count: number }[]>(Prisma.sql`
      SELECT
        COALESCE(${column}, 'UNKNOWN') AS label,
        COUNT(*)::int AS count
      FROM "Membership"
      GROUP BY ${column}
      ORDER BY count DESC
    `);
  }

  // ======================================================
  // USER ANALYTICS
  // ======================================================
  async userAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, active, createdToday, createdThisMonth] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      createdToday,
      createdThisMonth,
    };
  }

  // ======================================================
  // NEWS ANALYTICS
  // ======================================================
  async newsAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, published, drafts, publishedToday] = await Promise.all([
      this.prisma.news.count(),
      this.prisma.news.count({ where: { isPublished: true } }),
      this.prisma.news.count({ where: { isPublished: false } }),
      this.prisma.news.count({
        where: {
          isPublished: true,
          publishedAt: { gte: today },
        },
      }),
    ]);

    return {
      total,
      published,
      drafts,
      publishedToday,
    };
  }

  // ======================================================
  // SOCIAL ANALYTICS
  // ======================================================
  async socialAnalytics() {
    const platforms = ['INSTAGRAM', 'X'] as const;

    const results = await Promise.all(
      platforms.map(async (platform) => {
        const [total, active] = await Promise.all([
          this.prisma.socialPost.count({ where: { platform } }),
          this.prisma.socialPost.count({
            where: { platform, isActive: true },
          }),
        ]);

        return {
          platform,
          total,
          active,
          inactive: total - active,
        };
      }),
    );

    return results;
  }

  // ======================================================
  // OVERALL DASHBOARD
  // ======================================================
  async dashboard() {
    const [memberships, users, news, social] = await Promise.all([
      this.membershipAnalytics(),
      this.userAnalytics(),
      this.newsAnalytics(),
      this.socialAnalytics(),
    ]);

    return {
      memberships,
      users,
      news,
      social,
    };
  }
}
