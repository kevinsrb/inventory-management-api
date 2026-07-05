import { v7 as uuidv7 } from 'uuid';
import type { RepositoryContext, UnitOfWork } from '../../src/shared/application/ports';
import { Money, Quantity, Sku, Stock } from '../../src/shared/domain/value-objects';
import type { AlertRepository } from '../../src/modules/alerts/domain/alert.repository';
import { AlertStatus, type StockAlert } from '../../src/modules/alerts/domain/stock-alert';
import type { InventoryMovement } from '../../src/modules/inventory/domain/inventory';
import type { InventoryMovementRepository } from '../../src/modules/inventory/domain/inventory-movement.repository';
import { Product } from '../../src/modules/products/domain/product';
import type {
  InventoryFilters,
  ProductRepository,
} from '../../src/modules/products/domain/product.repository';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../../src/modules/purchase-orders/domain/purchase-order';
import type { PurchaseOrderRepository } from '../../src/modules/purchase-orders/domain/purchase-order.repository';

export class InMemoryStore {
  products: Product[] = [];
  movements: InventoryMovement[] = [];
  alerts: StockAlert[] = [];
  orders: PurchaseOrder[] = [];
  categories = [
    { id: uuidv7(), name: 'Bebidas' },
    { id: uuidv7(), name: 'Granos' },
  ];

  product(
    stock = 50,
    minimumStock = 10,
    sku = `SKU-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
  ): Product {
    const category = this.categories[0]!;
    const now = new Date();
    const product = Product.rehydrate({
      id: uuidv7(),
      sku: new Sku(sku),
      name: 'Producto de prueba',
      categoryId: category.id,
      categoryName: category.name,
      price: new Money(1000),
      currentStock: new Stock(stock),
      minimumStock: new Quantity(minimumStock),
      supplier: 'Proveedor de prueba',
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
    this.products.push(product);
    return product;
  }
}

class Products implements ProductRepository {
  constructor(private readonly store: InMemoryStore) {}
  async create(product: Product): Promise<void> {
    this.store.products.push(product);
  }
  async findById(id: string): Promise<Product | null> {
    return this.store.products.find((item) => item.id === id) ?? null;
  }
  async findBySku(sku: string): Promise<Product | null> {
    return this.store.products.find((item) => item.sku.value === sku) ?? null;
  }
  async findCategoryByName(name: string): Promise<{ id: string; name: string } | null> {
    return (
      this.store.categories.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }
  async updateStock(product: Product, expectedVersion: number): Promise<void> {
    const index = this.store.products.findIndex(
      (item) => item.id === product.id && item.version === expectedVersion,
    );
    if (index < 0) throw new Error('concurrent update');
    this.store.products[index] = product;
  }
  async findInventory(filters: InventoryFilters): Promise<Product[]> {
    return this.store.products.filter(
      (product) =>
        (!filters.category || product.categoryName === filters.category) &&
        (!filters.supplier || product.supplier === filters.supplier) &&
        (filters.minimumStock === undefined ||
          product.currentStock.value >= filters.minimumStock) &&
        (filters.maximumStock === undefined || product.currentStock.value <= filters.maximumStock),
    );
  }
}

class Movements implements InventoryMovementRepository {
  constructor(private readonly store: InMemoryStore) {}
  async create(movement: InventoryMovement): Promise<void> {
    this.store.movements.push(movement);
  }
  async findByProduct(productId: string): Promise<InventoryMovement[]> {
    return this.store.movements.filter((item) => item.productId === productId);
  }
}

class Alerts implements AlertRepository {
  constructor(private readonly store: InMemoryStore) {}
  async create(alert: StockAlert): Promise<void> {
    if (
      this.store.alerts.some(
        (item) => item.productId === alert.productId && item.status === AlertStatus.ACTIVE,
      )
    )
      throw new Error('duplicate active alert');
    this.store.alerts.push(alert);
  }
  async findById(id: string): Promise<StockAlert | null> {
    return this.store.alerts.find((item) => item.id === id) ?? null;
  }
  async findActiveByProduct(productId: string): Promise<StockAlert | null> {
    return (
      this.store.alerts.find(
        (item) => item.productId === productId && item.status === AlertStatus.ACTIVE,
      ) ?? null
    );
  }
  async resolve(alert: StockAlert): Promise<void> {
    const index = this.store.alerts.findIndex((item) => item.id === alert.id);
    if (index >= 0) this.store.alerts[index] = alert;
  }
  async findMany(status?: AlertStatus): Promise<StockAlert[]> {
    return status ? this.store.alerts.filter((item) => item.status === status) : this.store.alerts;
  }
}

class Orders implements PurchaseOrderRepository {
  constructor(private readonly store: InMemoryStore) {}
  async create(order: PurchaseOrder): Promise<void> {
    this.store.orders.push(order);
  }
  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.store.orders.find((item) => item.id === id) ?? null;
  }
  async update(order: PurchaseOrder): Promise<void> {
    const index = this.store.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) this.store.orders[index] = order;
  }
  async findMany(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return status ? this.store.orders.filter((item) => item.status === status) : this.store.orders;
  }
}

export class InMemoryUnitOfWork implements UnitOfWork {
  readonly repositories: RepositoryContext;
  constructor(readonly store = new InMemoryStore()) {
    this.repositories = {
      products: new Products(store),
      movements: new Movements(store),
      alerts: new Alerts(store),
      purchaseOrders: new Orders(store),
    };
  }
  execute<T>(work: (repositories: RepositoryContext) => Promise<T>): Promise<T> {
    return work(this.repositories);
  }
}
