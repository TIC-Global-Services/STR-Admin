import { IsOptional, IsString } from 'class-validator';

export class SuspendMembershipDto {
  @IsOptional()
  @IsString()
  reason?: string;
}