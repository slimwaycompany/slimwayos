import { IsNumber, IsString, IsOptional, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWeightDto {
  @ApiProperty({ example: 75.5 })
  @IsNumber()
  @Min(20)
  @Max(500)
  weightKg: number;

  @ApiProperty({ example: '2024-07-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
