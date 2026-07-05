import { v7 as uuidv7 } from 'uuid';
import type { UnitOfWork } from '../../../shared/application/ports';
import { Quantity } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import { AlertStatus } from '../../alerts/domain/stock-alert';
import { PurchaseOrder, PurchaseOrderPolicy } from '../domain/purchase-order';

export interface CreatePurchaseOrderCommand {
  productId: string;
  quantity: number;
  alertId?: string;
}

export class CreatePurchaseOrderUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}
  execute(command: CreatePurchaseOrderCommand): Promise<PurchaseOrder> {
    return this.unitOfWork.execute(async ({ products, alerts, purchaseOrders }) => {
      const product = await products.findById(command.productId);
      if (!product) throw new DomainError('NOT_FOUND', 'Producto no encontrado');
      const quantity = new Quantity(command.quantity);
      PurchaseOrderPolicy.validateMinimum(product, quantity);
      if (command.alertId) {
        const alert = await alerts.findById(command.alertId);
        if (!alert || alert.productId !== product.id || alert.status !== AlertStatus.ACTIVE) {
          throw new DomainError(
            'BUSINESS_RULE_VIOLATION',
            'La alerta debe estar ACTIVA y pertenecer al producto',
          );
        }
      }
      const order = PurchaseOrder.create({
        id: uuidv7(),
        productId: product.id,
        alertId: command.alertId ?? null,
        supplier: product.supplier,
        requestedAmount: quantity,
      });
      await purchaseOrders.create(order);
      return order;
    });
  }
}
