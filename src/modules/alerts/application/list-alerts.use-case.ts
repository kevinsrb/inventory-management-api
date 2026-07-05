import type { AlertRepository } from '../domain/alert.repository';
import type { AlertStatus, StockAlert } from '../domain/stock-alert';

export class ListAlertsUseCase {
  constructor(private readonly alerts: AlertRepository) {}
  execute(status?: AlertStatus): Promise<StockAlert[]> {
    return this.alerts.findMany(status);
  }
}
