import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /* ================================
     GENERATE OTP
  ================================= */

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /* ================================
     SEND OTP
  ================================= */

  async sendOtp(target: string, type: 'EMAIL' | 'PHONE') {
    if (!target) {
      throw new BadRequestException('Target is required');
    }

    if (type === 'EMAIL' && !target.includes('@')) {
      throw new BadRequestException('Invalid email');
    }

    // 60s cooldown
    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        target,
        type,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      throw new BadRequestException(
        'OTP already sent. Please wait 60 seconds.',
      );
    }

    // Remove old unverified OTPs
    await this.prisma.otpVerification.deleteMany({
      where: {
        target,
        type,
        verified: false,
      },
    });

    const otp = this.generateOtp();

    await this.prisma.otpVerification.create({
      data: {
        target,
        type,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    if (type === 'EMAIL') {
      await this.mailService.sendOtpEmail({
        email: target,
        otp,
      });
    }

    return { message: 'OTP sent successfully' };
  }

  /* ================================
     VERIFY OTP
  ================================= */

  async verifyOtp(target: string, otp: string, type: 'EMAIL' | 'PHONE') {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        target,
        type,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('No active OTP found');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.otpVerification.delete({
        where: { id: record.id },
      });
      throw new BadRequestException('OTP expired');
    }

    if (record.attempts >= 5) {
      await this.prisma.otpVerification.delete({
        where: { id: record.id },
      });
      throw new BadRequestException(
        'Too many incorrect attempts. Please request a new OTP.',
      );
    }

    if (record.otp !== otp) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      throw new BadRequestException('Invalid OTP');
    }

    // ✅ Mark verified permanently
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: {
        verified: true,
      },
    });

    return { message: `${type} verified successfully` };
  }

  /* ================================
     CHECK IF VERIFIED
  ================================= */

  async isVerified(target: string, type: 'EMAIL' | 'PHONE') {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        target,
        type,
        verified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return !!record;
  }

  /* ================================
     CLEAN EXPIRED OTPs (Cron Safe)
  ================================= */

  async cleanExpiredOtps() {
    await this.prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
