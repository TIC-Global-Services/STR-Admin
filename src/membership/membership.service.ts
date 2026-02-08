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
