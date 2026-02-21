import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyMembershipDto } from './dto/apply-membership.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // -------------------------
  // APPLY (PUBLIC)
  // -------------------------
  async apply(dto: ApplyMembershipDto) {
    const exists = await this.prisma.membership.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
          { aadharNumber: dto.aadharNumber },
        ],
      },
    });

    if (exists) {
      throw new BadRequestException('Membership already exists');
    }

    const year = new Date().getFullYear();
    const prefix = `STRFC-${year}-`;

    const lastMember = await this.prisma.membership.findFirst({
      where: {
        uniqueMemberId: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { uniqueMemberId: true },
    });

    let nextNumber = 1;

    if (lastMember?.uniqueMemberId) {
      const lastNumber = parseInt(
        lastMember.uniqueMemberId.split('-')[2] || '0',
      );
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = String(nextNumber).padStart(7, '0');
    const uniqueMemberId = `${prefix}${paddedNumber}`;

    const member = await this.prisma.membership.create({
      data: {
        ...dto,
        dob: new Date(dto.dob),
        uniqueMemberId,
      },
    });

    // 🔥 Send emails (non-blocking)
    this.sendMembershipEmails(member).catch((err) => {
      console.error('Email sending failed:', err);
    });

    return member;
  }

  async verify(memberId: string) {
  const member = await this.prisma.membership.findUnique({
    where: { uniqueMemberId: memberId },
    select: {
      uniqueMemberId: true,
      fullName: true,
      zone: true,
      district: true,
      state: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  if (!member) {
    return {
      valid: false,
      message: 'Invalid Membership ID',
    };
  }

  // If you only want ID card for APPROVED users
  if (member.status !== 'APPROVED') {
    return {
      valid: false,
      message: 'Membership not approved',
      status: member.status,
    };
  }

  return {
    valid: true,
    membershipId: member.uniqueMemberId,
    fullName: member.fullName,
    zone: member.zone,
    district: member.district,
    state: member.state,
    status: member.status,
    membershipYear: member.createdAt.getFullYear(),
    verifiedAt: member.reviewedAt,
  };
}
  private async sendMembershipEmails(member: any) {
    const adminEmail = process.env.ADMIN_EMAIL;

    await Promise.allSettled([
      this.mailService.sendMemberConfirmation({
        name: member.fullName,
        email: member.email,
        uniqueMemberId: member.uniqueMemberId,
      }),
      this.mailService.sendAdminNotification(adminEmail!, {
        name: member.fullName,
        email: member.email,
        phone: member.phone,
        uniqueMemberId: member.uniqueMemberId,
      }),
    ]);
  }
  // -------------------------
  // LIST PENDING (ADMIN)
  // -------------------------
  findPending() {
    return this.prisma.membership.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.membership.findMany();
  }

  async findWithFilter(dimension?: string, value?: string) {
    const where: any = {};

    if (dimension && value) {
      // Allow only valid fields (security)
      const allowedDimensions = [
        'state',
        'district',
        'zone',
        'bloodGroup',
        'occupation',
        'status',
      ];

      if (!allowedDimensions.includes(dimension)) {
        throw new BadRequestException('Invalid filter dimension');
      }

      where[dimension] = {
        equals: value,
        mode: 'insensitive', // case-insensitive
      };
    }

    return this.prisma.membership.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  findApproved() {
    return this.prisma.membership.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRejected() {
    return this.prisma.membership.findMany({
      where: { status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------
  // APPROVE
  // -------------------------
  async approve(id: string, adminId: string) {
    const member = await this.prisma.membership.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    this.mailService
      .sendMembershipApproved({
        name: member.fullName,
        email: member.email,
        uniqueMemberId: member.uniqueMemberId,
      })
      .catch((err) => console.error('Approval email failed:', err));

    return member;
  }

  async reject(id: string, adminId: string, reason: string) {
    const member = await this.prisma.membership.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    this.mailService
      .sendMembershipRejected({
        name: member.fullName,
        email: member.email,
        reason,
      })
      .catch((err) => console.error('Rejection email failed:', err));

    return member;
  }
}
