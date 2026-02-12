import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApplyMembershipDto } from './dto/apply-membership.dto';

@Controller('membership')
export class MembershipPublicController {
  constructor(private readonly service: MembershipService) {}

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
