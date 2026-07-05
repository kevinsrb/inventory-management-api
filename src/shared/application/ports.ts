import type { AlertRepository } from '../../modules/alerts/domain/alert.repository';
import type { InventoryMovementRepository } from '../../modules/inventory/domain/inventory-movement.repository';
import type { ProductRepository } from '../../modules/products/domain/product.repository';
import type { PurchaseOrderRepository } from '../../modules/purchase-orders/domain/purchase-order.repository';

export interface RepositoryContext {
  products: ProductRepository;
  movements: InventoryMovementRepository;
  alerts: AlertRepository;
  purchaseOrders: PurchaseOrderRepository;
}

export interface UnitOfWork {
  execute<T>(work: (repositories: RepositoryContext) => Promise<T>): Promise<T>;
}

export const TOKENS = {
  products: Symbol('ProductRepository'),
  movements: Symbol('InventoryMovementRepository'),
  alerts: Symbol('AlertRepository'),
  purchaseOrders: Symbol('PurchaseOrderRepository'),
  unitOfWork: Symbol('UnitOfWork'),
} as const;
