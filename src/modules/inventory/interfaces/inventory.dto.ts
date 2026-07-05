import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { MovementType } from '../domain/inventory';

export class AdjustInventoryDto {
  @ApiProperty({ enum: Object.values(MovementType), example: 'SALIDA' })
  @IsIn(Object.values(MovementType))
  type!: MovementType;
  @ApiProperty({ example: 5 }) @IsInt() @Min(1) quantity!: number;
  @ApiProperty({ example: 'Venta en punto físico' }) @IsString() @Length(3, 250) reason!: string;
}

export class InventoryQueryDto {
  @ApiPropertyOptional({ example: 'Bebidas' }) @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ example: 'Distribuidora Andina' })
  @IsOptional()
  @IsString()
  supplier?: string;
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasActiveAlert?: boolean;
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock?: number;
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumStock?: number;
}
