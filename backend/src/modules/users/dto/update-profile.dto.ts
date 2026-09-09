import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeightKg?: number;

  @ApiPropertyOptional({ enum: ActivityLevel })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: string;
}
