import { Quantity, Stock } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import type { Product } from '../../products/domain/product';

export const MovementType = { ENTRY: 'ENTRADA', EXIT: 'SALIDA' } as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: Quantity;
  reason: string;
  createdAt: Date;
}

export class InventoryPolicy {
  static adjust(product: Product, type: MovementType, quantity: Quantity): Stock {
    if (type === MovementType.ENTRY) return new Stock(product.currentStock.value + quantity.value);
    const result = product.currentStock.value - quantity.value;
    if (result < 0) {
      throw new DomainError(
        'BUSINESS_RULE_VIOLATION',
        `Stock insuficiente: faltan ${Math.abs(result)} unidades`,
        {
          available: product.currentStock.value,
          requested: quantity.value,
          shortage: Math.abs(result),
        },
      );
    }
    return new Stock(result);
  }

  static validateReason(reason: string): string {
    const normalized = reason.trim();
    if (normalized.length < 3 || normalized.length > 250) {
      throw new DomainError('VALIDATION_ERROR', 'El motivo debe tener entre 3 y 250 caracteres');
    }
    return normalized;
  }
}
