import type { AlertStatus, StockAlert } from './stock-alert';

export interface AlertRepository {
  create(alert: StockAlert): Promise<void>;
  findById(id: string): Promise<StockAlert | null>;
  findActiveByProduct(productId: string): Promise<StockAlert | null>;
  resolve(alert: StockAlert): Promise<void>;
  findMany(status?: AlertStatus): Promise<StockAlert[]>;
}
