import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Café Molido 500g' }) @IsString() @Length(3, 100) name!: string;
  @ApiProperty({ example: 'GRA-003' }) @IsString() @Matches(/^[A-Za-z0-9-]{6,20}$/) sku!: string;
  @ApiProperty({ example: 'Granos' }) @IsString() @Length(1, 100) category!: string;
  @ApiProperty({ example: 18500 }) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() price!: number;
  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentStock?: number;
  @ApiProperty({ example: 20 }) @IsInt() @Min(1) minimumStock!: number;
  @ApiProperty({ example: 'Café Colombia S.A.S.' }) @IsString() @MaxLength(120) supplier!: string;
}
