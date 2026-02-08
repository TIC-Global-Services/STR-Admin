import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { RejectMembershipDto } from './dto/reject-membership.dto';

@Controller('admin/memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipController {
  constructor(private readonly service: MembershipService) {}

  @Get('pending')
  @Permissions('MEMBERSHIP_APPROVE')
  getPending() {
    return this.service.findPending();
  }

  @Post(':id/approve')
  @Permissions('MEMBERSHIP_APPROVE')
  approve(@Param('id') id: string, @Request() req) {
    req.auditAction = {
      action: 'MEMBERSHIP_APPROVE',
      entity: 'Membership',
      entityId: id,
    };
    return this.service.approve(id, req.user.sub);
  }

  @Post(':id/reject')
  @Permissions('MEMBERSHIP_REJECT')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectMembershipDto,
    @Request() req,
  ) {
    return this.service.reject(id, req.user.sub, dto.reason);
  }
}
