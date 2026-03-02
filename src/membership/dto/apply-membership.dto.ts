import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class ApplyMembershipDto {
  // ───────── Personal ─────────
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsDateString()
  dob: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsString()
  @IsNotEmpty()
  aadhaarNumber: string;

  // ───────── Contact ─────────
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  // ───────── Location ─────────
  @IsString()
  country: string;

  @IsString()
  state: string;

  @IsString()
  city: string;

  // ───────── Fan Info ─────────
  @IsOptional()
  @IsString()
  existingClub?: string;

  @IsOptional()
  @IsString()
  fanClubName?: string;

  @IsOptional()
  @IsString()
  chapterLocation?: string;

  @IsOptional()
  @IsString()
  willingToJoin?: string;

  @IsOptional()
  @IsString()
  chapterLead?: string;

  @IsOptional()
  @IsString()
  fanDuration?: string;

  @IsOptional()
  @IsString()
  favoriteMovie?: string;

  @IsOptional()
  @IsString()
  favoriteSong?: string;

  @IsOptional()
  @IsString()
  socialHandle?: string;

  @IsOptional()
  @IsString()
  tshirtSize?: string;

  @IsString()
  membershipType: string;

  // ───────── Consent ─────────
  @IsBoolean()
  agreeTerms: boolean;

  @IsBoolean()
  ageConfirm: boolean;
}