import type { StockAlert } from '../../modules/alerts/domain/stock-alert';
import type { InventoryMovement } from '../../modules/inventory/domain/inventory';
import type { Product } from '../../modules/products/domain/product';
import type { PurchaseOrder } from '../../modules/purchase-orders/domain/purchase-order';

export function presentProduct(product: Product): Record<string, unknown> {
  return {
    id: product.id,
    sku: product.sku.value,
    name: product.name,
    category: { id: product.categoryId, name: product.categoryName },
    price: product.price.amount,
    currentStock: product.currentStock.value,
    minimumStock: product.minimumStock.value,
    supplier: product.supplier,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
export function presentMovement(movement: InventoryMovement): Record<string, unknown> {
  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantity: movement.quantity.value,
    reason: movement.reason,
    createdAt: movement.createdAt,
  };
}
export function presentAlert(alert: StockAlert): Record<string, unknown> {
  return {
    id: alert.id,
    productId: alert.productId,
    type: alert.type,
    status: alert.status,
    createdAt: alert.createdAt,
    resolvedAt: alert.resolvedAt,
  };
}
export function presentOrder(order: PurchaseOrder): Record<string, unknown> {
  return {
    id: order.id,
    productId: order.productId,
    alertId: order.alertId,
    supplier: order.supplier,
    requestedAmount: order.requestedAmount.value,
    status: order.status,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    receivedAt: order.receivedAt,
  };
}
