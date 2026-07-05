import type { PurchaseOrderRepository } from '../domain/purchase-order.repository';
import type { PurchaseOrder, PurchaseOrderStatus } from '../domain/purchase-order';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly orders: PurchaseOrderRepository) {}
  execute(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return this.orders.findMany(status);
  }
}
