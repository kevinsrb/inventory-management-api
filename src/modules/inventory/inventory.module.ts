import { Module } from '@nestjs/common';
import { TOKENS, type UnitOfWork } from '../../shared/application/ports';
import type { InventoryMovementRepository } from './domain/inventory-movement.repository';
import type { ProductRepository } from '../products/domain/product.repository';
import { AdjustInventoryUseCase } from './application/adjust-inventory.use-case';
import { GetInventoryUseCase } from './application/get-inventory.use-case';
import { GetMovementsUseCase } from './application/get-movements.use-case';
import { InventoryController } from './interfaces/inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [
    {
      provide: AdjustInventoryUseCase,
      useFactory: (uow: UnitOfWork): AdjustInventoryUseCase => new AdjustInventoryUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
    {
      provide: GetInventoryUseCase,
      useFactory: (repo: ProductRepository): GetInventoryUseCase => new GetInventoryUseCase(repo),
      inject: [TOKENS.products],
    },
    {
      provide: GetMovementsUseCase,
      useFactory: (repo: InventoryMovementRepository): GetMovementsUseCase =>
        new GetMovementsUseCase(repo),
      inject: [TOKENS.movements],
    },
  ],
})
export class InventoryModule {}
