import type { UnitOfWork } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/exceptions/domain.error';
import type { StockAlert } from '../domain/stock-alert';

export class CloseStockAlertUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}
  execute(id: string): Promise<StockAlert> {
    return this.unitOfWork.execute(async ({ alerts }) => {
      const alert = await alerts.findById(id);
      if (!alert) throw new DomainError('NOT_FOUND', 'Alerta no encontrada');
      const resolved = alert.resolve();
      await alerts.resolve(resolved);
      return resolved;
    });
  }
}
