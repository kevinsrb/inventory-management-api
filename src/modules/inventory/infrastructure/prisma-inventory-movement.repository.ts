import { Prisma, type PrismaClient } from '@prisma/client';
import { Quantity } from '../../../shared/domain/value-objects';
import { MovementType, type InventoryMovement } from '../domain/inventory';
import type { InventoryMovementRepository } from '../domain/inventory-movement.repository';

type Client = PrismaClient | Prisma.TransactionClient;

export class PrismaInventoryMovementRepository implements InventoryMovementRepository {
  constructor(private readonly client: Client) {}
  async create(movement: InventoryMovement): Promise<void> {
    await this.client.inventoryMovement.create({
      data: {
        id: movement.id,
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity.value,
        reason: movement.reason,
        createdAt: movement.createdAt,
      },
    });
  }
  async findByProduct(productId: string): Promise<InventoryMovement[]> {
    const rows = await this.client.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      type: row.type === MovementType.ENTRY ? MovementType.ENTRY : MovementType.EXIT,
      quantity: new Quantity(row.quantity),
      reason: row.reason,
      createdAt: row.createdAt,
    }));
  }
}
