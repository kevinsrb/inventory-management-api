import { Module } from '@nestjs/common';
import { TOKENS, type UnitOfWork } from '../../shared/application/ports';
import { CreateProductUseCase } from './application/create-product.use-case';
import { ListProductsUseCase } from './application/list-products.use-case';
import type { ProductRepository } from './domain/product.repository';
import { ProductsController } from './interfaces/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: CreateProductUseCase,
      useFactory: (uow: UnitOfWork): CreateProductUseCase => new CreateProductUseCase(uow),
      inject: [TOKENS.unitOfWork],
    },
    {
      provide: ListProductsUseCase,
      useFactory: (repository: ProductRepository): ListProductsUseCase =>
        new ListProductsUseCase(repository),
      inject: [TOKENS.products],
    },
  ],
})
export class ProductsModule {}
