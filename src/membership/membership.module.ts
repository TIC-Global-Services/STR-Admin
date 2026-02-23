import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MembershipPublicController } from './membership-public.controller';
import { OtpModule } from 'src/otp/otp.module';

@Module({
  imports:[OtpModule],
  controllers: [MembershipController, MembershipPublicController],
  providers: [MembershipService],
})
export class MembershipModule {}
