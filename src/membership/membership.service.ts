import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyMembershipDto } from './dto/apply-membership.dto';
import { MailService } from 'src/mail/mail.service';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
  ) {}

  // -------------------------
  // APPLY (PUBLIC)
  // -------------------------
  async apply(dto: ApplyMembershipDto) {
    // 1️⃣ Check consent
    if (!dto.agreeTerms || !dto.ageConfirm) {
      throw new BadRequestException('You must accept terms and confirm age.');
    }

    // 2️⃣ Check email verified
    const isVerified = await this.otpService.isVerified(dto.email, 'EMAIL');

    if (!isVerified) {
      throw new BadRequestException('Email not verified.');
    }

    // 3️⃣ Prevent duplicates
    const exists = await this.prisma.membership.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
          { aadhaarNumber: dto.aadhaarNumber },
        ],
      },
    });

    if (exists) {
      throw new BadRequestException('Membership already exists');
    }

    // 4️⃣ Generate Unique ID safely (transaction)
    const member = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const prefix = `STRFC-${year}-`;

      const count = await tx.membership.count({
        where: {
          uniqueMemberId: {
            startsWith: prefix,
          },
        },
      });

      const nextNumber = count + 1;
      const paddedNumber = String(nextNumber).padStart(7, '0');
      const uniqueMemberId = `${prefix}${paddedNumber}`;

      return tx.membership.create({
        data: {
          ...dto,
          dob: new Date(dto.dob),
          uniqueMemberId,
          emailVerified: true,
        },
      });
    });

    this.sendMembershipEmails(member).catch(console.error);

    return {
      message: 'Application submitted successfully',
      membershipId: member.uniqueMemberId,
    };
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

  async suspend(id: string, adminId: string, reason?: string) {
  const member = await this.prisma.membership.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      suspensionReason: reason,
      suspendedAt: new Date(),
      reviewedById: adminId,
    },
  });

  return member;
}
}
