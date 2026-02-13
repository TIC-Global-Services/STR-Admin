import { IsString, IsOptional } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  isPublished?: boolean;
}
