import type { InventoryMovementRepository } from '../domain/inventory-movement.repository';
import type { InventoryMovement } from '../domain/inventory';

export class GetMovementsUseCase {
  constructor(private readonly movements: InventoryMovementRepository) {}
  execute(productId: string): Promise<InventoryMovement[]> {
    return this.movements.findByProduct(productId);
  }
}
