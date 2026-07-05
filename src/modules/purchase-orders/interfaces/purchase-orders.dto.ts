import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { PurchaseOrderStatus } from '../domain/purchase-order';

export class CreatePurchaseOrderDto {
  @ApiProperty({ format: 'uuid', example: '01977d65-75c8-7000-8000-000000000001' })
  @IsUUID()
  productId!: string;
  @ApiProperty({ example: 100 }) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional({ format: 'uuid', description: 'Alerta activa que origina la orden' })
  @IsOptional()
  @IsUUID()
  alertId?: string;
}

export class RejectPurchaseOrderDto {
  @ApiProperty({ example: 'El proveedor no tiene disponibilidad' })
  @IsString()
  @Length(10, 250)
  reason!: string;
}

export class PurchaseOrdersQueryDto {
  @ApiPropertyOptional({ enum: Object.values(PurchaseOrderStatus), example: 'PENDIENTE' })
  @IsOptional()
  @IsIn(Object.values(PurchaseOrderStatus))
  status?: PurchaseOrderStatus;
}
