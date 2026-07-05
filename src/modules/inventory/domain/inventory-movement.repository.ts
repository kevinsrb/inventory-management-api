import type { InventoryMovement } from './inventory';

export interface InventoryMovementRepository {
  create(movement: InventoryMovement): Promise<void>;
  findByProduct(productId: string): Promise<InventoryMovement[]>;
}
