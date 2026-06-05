import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  location!: string;

  @IsInt()
  @Min(1)
  priceCents!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(1)
  guestLimit!: number;

  @IsArray()
  itinerary!: unknown[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  images?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
