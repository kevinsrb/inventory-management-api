import type { PurchaseOrder, PurchaseOrderStatus } from './purchase-order';

export interface PurchaseOrderRepository {
  create(order: PurchaseOrder): Promise<void>;
  findById(id: string): Promise<PurchaseOrder | null>;
  update(order: PurchaseOrder): Promise<void>;
  findMany(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]>;
}
