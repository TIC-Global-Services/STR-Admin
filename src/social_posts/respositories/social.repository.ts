import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------
  // COUNT ACTIVE
  // -------------------------
  countActive(platform: 'INSTAGRAM' | 'X') {
    return this.prisma.socialPost.count({
      where: {
        platform,
        isActive: true,
      },
    });
  }

  // -------------------------
  // CREATE
  // -------------------------
  create(
    platform: 'INSTAGRAM' | 'X',
    data: {
      postUrl: string;
      caption?: string;
      isActive: boolean;
    },
    userId: string,
  ) {
    return this.prisma.socialPost.create({
      data: {
        platform,
        postUrl: data.postUrl,
        caption: data.caption,
        isActive: data.isActive,
        createdBy: userId,
      },
    });
  }

  // -------------------------
  // UPDATE BY ID
  // -------------------------
  update(
    id: string,
    data: {
      postUrl?: string;
      caption?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.socialPost.update({
      where: { id }, 
      data,
    });
  }

  // -------------------------
  // ADMIN LIST
  // -------------------------
  findAdmin(platform: 'INSTAGRAM' | 'X') {
    return this.prisma.socialPost.findMany({
      where: { platform },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------
  // PUBLIC (MAX 3 ACTIVE)
  // -------------------------
  findActive(platform: 'INSTAGRAM' | 'X') {
    return this.prisma.socialPost.findMany({
      where: {
        platform,
        isActive: true,
      },
      take: 3,
      orderBy: { updatedAt: 'desc' },
      select: {
        postUrl: true,
        caption: true,
      },
    });
  }
}
