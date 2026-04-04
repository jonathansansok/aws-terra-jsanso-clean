import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class DescribeProductDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
