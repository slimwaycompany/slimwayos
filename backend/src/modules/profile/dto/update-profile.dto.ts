import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(80) first_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(80) last_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(80) middle_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() birth_date?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) position?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) department?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bio?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() photo_url?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() theme_bg_color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() theme_font_color?: string;
}
