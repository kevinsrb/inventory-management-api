import { Module } from '@nestjs/common';
import { TOKENS, type UnitOfWork } from '../../shared/application/ports';
import type { AlertRepository } from './domain/alert.repository';
import { CloseStockAlertUseCase } from './application/close-stock-alert.use-case';
import { ListAlertsUseCase } from './application/list-alerts.use-case';
import { AlertsController } from './interfaces/alerts.controller';

@Module({
  controllers: [AlertsController],
  providers: [
    {
      provide: ListAlertsUseCase,
      useFactory: (repo: AlertRepository): ListAlertsUseCase => new ListAlertsUseCase(repo),
      inject: [TOKENS.alerts],
    },
    {
      provide: CloseStockAlertUseCase,
      useFactory: (uow: UnitOfWork): CloseStockAlertUseCase => new CloseStockAlertUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
  ],
})
export class AlertsModule {}
