import { v7 as uuidv7 } from 'uuid';
import type { UnitOfWork } from '../../../shared/application/ports';
import { Quantity } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import { StockAlert, StockAlertPolicy } from '../../alerts/domain/stock-alert';
import type { Product } from '../../products/domain/product';
import { InventoryPolicy, type MovementType } from '../domain/inventory';

export interface AdjustInventoryCommand {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

export class AdjustInventoryUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: AdjustInventoryCommand): Promise<Product> {
    return this.unitOfWork.execute(async ({ products, movements, alerts }) => {
      const product = await products.findById(command.productId);
      if (!product) throw new DomainError('NOT_FOUND', 'Producto no encontrado');
      const quantity = new Quantity(command.quantity);
      const reason = InventoryPolicy.validateReason(command.reason);
      const updated = product.withStock(InventoryPolicy.adjust(product, command.type, quantity));
      await products.updateStock(updated, product.version);
      await movements.create({
        id: uuidv7(),
        productId: product.id,
        type: command.type,
        quantity,
        reason,
        createdAt: new Date(),
      });

      const activeAlert = await alerts.findActiveByProduct(product.id);
      if (StockAlertPolicy.requiresActiveAlert(updated) && !activeAlert) {
        await alerts.create(StockAlert.create(uuidv7(), product.id));
      } else if (StockAlertPolicy.canResolve(updated) && activeAlert) {
        await alerts.resolve(activeAlert.resolve());
      }
      return updated;
    });
  }
}
