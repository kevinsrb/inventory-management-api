import { Global, Module } from '@nestjs/common';
import { TOKENS } from '../application/ports';
import { PrismaAlertRepository } from '../../modules/alerts/infrastructure/prisma-alert.repository';
import { PrismaInventoryMovementRepository } from '../../modules/inventory/infrastructure/prisma-inventory-movement.repository';
import { PrismaProductRepository } from '../../modules/products/infrastructure/prisma-product.repository';
import { PrismaPurchaseOrderRepository } from '../../modules/purchase-orders/infrastructure/prisma-purchase-order.repository';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWork } from './prisma-unit-of-work';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: TOKENS.products,
      useFactory: (db: PrismaService): PrismaProductRepository => new PrismaProductRepository(db),
      inject: [PrismaService],
    },
    {
      provide: TOKENS.movements,
      useFactory: (db: PrismaService): PrismaInventoryMovementRepository =>
        new PrismaInventoryMovementRepository(db),
      inject: [PrismaService],
    },
    {
      provide: TOKENS.alerts,
      useFactory: (db: PrismaService): PrismaAlertRepository => new PrismaAlertRepository(db),
      inject: [PrismaService],
    },
    {
      provide: TOKENS.purchaseOrders,
      useFactory: (db: PrismaService): PrismaPurchaseOrderRepository =>
        new PrismaPurchaseOrderRepository(db),
      inject: [PrismaService],
    },
    {
      provide: TOKENS.unitOfWork,
      useFactory: (db: PrismaService): PrismaUnitOfWork => new PrismaUnitOfWork(db),
      inject: [PrismaService],
    },
  ],
  exports: [
    PrismaService,
    TOKENS.products,
    TOKENS.movements,
    TOKENS.alerts,
    TOKENS.purchaseOrders,
    TOKENS.unitOfWork,
  ],
})
export class DatabaseModule {}
