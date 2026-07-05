import { Prisma } from '@prisma/client';
import type { RepositoryContext, UnitOfWork } from '../application/ports';
import { DomainError } from '../exceptions/domain.error';
import { PrismaAlertRepository } from '../../modules/alerts/infrastructure/prisma-alert.repository';
import { PrismaInventoryMovementRepository } from '../../modules/inventory/infrastructure/prisma-inventory-movement.repository';
import { PrismaProductRepository } from '../../modules/products/infrastructure/prisma-product.repository';
import { PrismaPurchaseOrderRepository } from '../../modules/purchase-orders/infrastructure/prisma-purchase-order.repository';
import { PrismaService } from './prisma.service';

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}
  async execute<T>(work: (repositories: RepositoryContext) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (transaction) =>
          work({
            products: new PrismaProductRepository(transaction),
            movements: new PrismaInventoryMovementRepository(transaction),
            alerts: new PrismaAlertRepository(transaction),
            purchaseOrders: new PrismaPurchaseOrderRepository(transaction),
          }),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        },
      );
    } catch (error) {
      if (error instanceof DomainError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DomainError('CONFLICT', 'La operación viola una restricción de unicidad');
      }
      throw error;
    }
  }
}
