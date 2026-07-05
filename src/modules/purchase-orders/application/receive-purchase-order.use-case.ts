import { v7 as uuidv7 } from 'uuid';
import type { UnitOfWork } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/exceptions/domain.error';
import { StockAlertPolicy } from '../../alerts/domain/stock-alert';
import { InventoryPolicy, MovementType } from '../../inventory/domain/inventory';
import type { PurchaseOrder } from '../domain/purchase-order';

export class ReceivePurchaseOrderUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}
  execute(id: string): Promise<PurchaseOrder> {
    return this.unitOfWork.execute(async ({ purchaseOrders, products, movements, alerts }) => {
      const order = await purchaseOrders.findById(id);
      if (!order) throw new DomainError('NOT_FOUND', 'Orden de compra no encontrada');
      const received = order.receive();
      const product = await products.findById(order.productId);
      if (!product) throw new DomainError('NOT_FOUND', 'Producto no encontrado');
      const updated = product.withStock(
        InventoryPolicy.adjust(product, MovementType.ENTRY, order.requestedAmount),
      );

      await purchaseOrders.update(received);
      await products.updateStock(updated, product.version);
      await movements.create({
        id: uuidv7(),
        productId: product.id,
        type: MovementType.ENTRY,
        quantity: order.requestedAmount,
        reason: `Recepción de orden de compra ${order.id}`,
        createdAt: new Date(),
      });
      const activeAlert = await alerts.findActiveByProduct(product.id);
      if (activeAlert && StockAlertPolicy.canResolve(updated))
        await alerts.resolve(activeAlert.resolve());
      return received;
    });
  }
}
