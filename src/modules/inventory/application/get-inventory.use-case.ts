import type { InventoryFilters, ProductRepository } from '../../products/domain/product.repository';
import type { Product } from '../../products/domain/product';

export class GetInventoryUseCase {
  constructor(private readonly products: ProductRepository) {}
  execute(filters: InventoryFilters): Promise<Product[]> {
    return this.products.findInventory(filters);
  }
}
