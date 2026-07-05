import type { UnitOfWork } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/exceptions/domain.error';
import type { PurchaseOrder } from '../domain/purchase-order';

export class ApprovePurchaseOrderUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}
  execute(id: string): Promise<PurchaseOrder> {
    return this.unitOfWork.execute(async ({ purchaseOrders }) => {
      const order = await purchaseOrders.findById(id);
      if (!order) throw new DomainError('NOT_FOUND', 'Orden de compra no encontrada');
      const approved = order.approve();
      await purchaseOrders.update(approved);
      return approved;
    });
  }
}
