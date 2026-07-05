import { Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { presentAlert } from '../../../shared/interfaces/presenters';
import { CloseStockAlertUseCase } from '../application/close-stock-alert.use-case';
import { ListAlertsUseCase } from '../application/list-alerts.use-case';
import { AlertsQueryDto } from './alerts.dto';

@ApiTags('Alertas')
@Controller('alerts')
export class AlertsController {
  constructor(
    @Inject(ListAlertsUseCase) private readonly listAlerts: ListAlertsUseCase,
    @Inject(CloseStockAlertUseCase) private readonly closeAlert: CloseStockAlertUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar alertas por estado' })
  @ApiBody({ required: false, description: 'Este endpoint no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Listado de alertas',
    schema: { example: [{ type: 'STOCK_BAJO', status: 'ACTIVA', productId: '0197...' }] },
  })
  async find(@Query() query: AlertsQueryDto): Promise<Record<string, unknown>[]> {
    return (await this.listAlerts.execute(query.status)).map(presentAlert);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar manualmente una alerta activa' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ required: false, description: 'El cierre no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Alerta resuelta',
    schema: {
      example: { id: '0197...', status: 'RESUELTA', resolvedAt: '2026-07-02T12:00:00.000Z' },
    },
  })
  @ApiResponse({ status: 422, description: 'La alerta ya estaba resuelta' })
  async close(@Param('id', new ParseUUIDPipe()) id: string): Promise<Record<string, unknown>> {
    return presentAlert(await this.closeAlert.execute(id));
  }
}
