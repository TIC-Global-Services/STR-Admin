import { OtpService } from './../otp/otp.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApplyMembershipDto } from './dto/apply-membership.dto';

@Controller('membership')
export class MembershipPublicController {
  constructor(
    private readonly service: MembershipService,
    private readonly otpService: OtpService,
  ) {}

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    return this.otpService.sendOtp(body.email, 'EMAIL');
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.otpService.verifyOtp(body.email, body.otp, 'EMAIL');
  }

  @Public()
  @Post('apply')
  apply(@Body() dto: ApplyMembershipDto) {
    return this.service.apply(dto);
  }

  @Get('verify/:memberId')
  verify(@Param('memberId') memberId: string) {
    return this.service.verify(memberId);
  }
}
