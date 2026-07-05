import type { Product } from '../domain/product';
import type { ProductRepository } from '../domain/product.repository';

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(): Promise<Product[]> {
    return this.products.findInventory({});
  }
}
