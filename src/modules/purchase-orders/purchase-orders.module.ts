import { Module } from '@nestjs/common';
import { TOKENS, type UnitOfWork } from '../../shared/application/ports';
import type { PurchaseOrderRepository } from './domain/purchase-order.repository';
import { ApprovePurchaseOrderUseCase } from './application/approve-purchase-order.use-case';
import { CreatePurchaseOrderUseCase } from './application/create-purchase-order.use-case';
import { ListPurchaseOrdersUseCase } from './application/list-purchase-orders.use-case';
import { ReceivePurchaseOrderUseCase } from './application/receive-purchase-order.use-case';
import { RejectPurchaseOrderUseCase } from './application/reject-purchase-order.use-case';
import { PurchaseOrdersController } from './interfaces/purchase-orders.controller';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [
    {
      provide: CreatePurchaseOrderUseCase,
      useFactory: (uow: UnitOfWork): CreatePurchaseOrderUseCase =>
        new CreatePurchaseOrderUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
    {
      provide: ListPurchaseOrdersUseCase,
      useFactory: (repo: PurchaseOrderRepository): ListPurchaseOrdersUseCase =>
        new ListPurchaseOrdersUseCase(repo),
      inject: [TOKENS.purchaseOrders],
    },
    {
      provide: ApprovePurchaseOrderUseCase,
      useFactory: (uow: UnitOfWork): ApprovePurchaseOrderUseCase =>
        new ApprovePurchaseOrderUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
    {
      provide: RejectPurchaseOrderUseCase,
      useFactory: (uow: UnitOfWork): RejectPurchaseOrderUseCase =>
        new RejectPurchaseOrderUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
    {
      provide: ReceivePurchaseOrderUseCase,
      useFactory: (uow: UnitOfWork): ReceivePurchaseOrderUseCase =>
        new ReceivePurchaseOrderUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
  ],
})
export class PurchaseOrdersModule {}
