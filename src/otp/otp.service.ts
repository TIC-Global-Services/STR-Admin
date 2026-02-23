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

    // Basic email validation
    if (type === 'EMAIL' && !target.includes('@')) {
      throw new BadRequestException('Invalid email');
    }

    // Cooldown: 60 seconds
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
        'OTP already sent. Please wait before requesting again.',
      );
    }

    // Delete old OTPs for this target
    await this.prisma.otpVerification.deleteMany({
      where: { target, type },
    });

    const otp = this.generateOtp();

    await this.prisma.otpVerification.create({
      data: {
        target,
        type,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
      },
    });

    if (type === 'EMAIL') {
      await this.mailService.sendOtpEmail({
        email: target,
        otp,
      });
    }

    if (type === 'PHONE') {
      // Future SMS integration
      // await this.smsService.sendOtp(target, otp);
    }

    return { message: 'OTP sent successfully' };
  }

  /* ================================
     VERIFY OTP
  ================================= */
  async verifyOtp(target: string, otp: string, type: 'EMAIL' | 'PHONE') {
    const record = await this.prisma.otpVerification.findFirst({
      where: { target, otp, type },
    });

    if (!record) {
      throw new BadRequestException('Invalid OTP');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.otpVerification.delete({
        where: { id: record.id },
      });
      throw new BadRequestException('OTP expired');
    }

    await this.prisma.otpVerification.delete({
      where: { id: record.id },
    });

    return { message: `${type} verified successfully` };
  }

  /* ================================
     CLEAN EXPIRED OTPs (Optional Cron)
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
