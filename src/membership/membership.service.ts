import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyMembershipDto } from './dto/apply-membership.dto';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.membership.create({
      data: {
        ...dto,
        dob: new Date(dto.dob),
      },
    });
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
    return this.prisma.membership.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  // -------------------------
  // REJECT
  // -------------------------
  async reject(id: string, adminId: string, reason: string) {
    return this.prisma.membership.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
  }
}
