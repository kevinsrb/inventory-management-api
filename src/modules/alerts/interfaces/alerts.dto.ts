import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { AlertStatus } from '../domain/stock-alert';

export class AlertsQueryDto {
  @ApiPropertyOptional({ enum: Object.values(AlertStatus), example: 'ACTIVA' })
  @IsOptional()
  @IsIn(Object.values(AlertStatus))
  status?: AlertStatus;
}
