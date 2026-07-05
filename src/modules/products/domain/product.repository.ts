import type { Product } from './product';

export interface InventoryFilters {
  category?: string;
  supplier?: string;
  hasActiveAlert?: boolean;
  minimumStock?: number;
  maximumStock?: number;
}

export interface ProductRepository {
  create(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findCategoryByName(name: string): Promise<{ id: string; name: string } | null>;
  updateStock(product: Product, expectedVersion: number): Promise<void>;
  findInventory(filters: InventoryFilters): Promise<Product[]>;
}
