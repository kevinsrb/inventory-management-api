import { Prisma, type PrismaClient } from '@prisma/client';
import { Money, Quantity, Sku, Stock } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import { Product } from '../domain/product';
import type { InventoryFilters, ProductRepository } from '../domain/product.repository';

type Client = PrismaClient | Prisma.TransactionClient;
const productInclude = { category: true } as const;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly client: Client) {}

  async create(product: Product): Promise<void> {
    await this.client.product.create({
      data: {
        id: product.id,
        sku: product.sku.value,
        name: product.name,
        categoryId: product.categoryId,
        price: product.price.amount,
        currentStock: product.currentStock.value,
        minimumStock: product.minimumStock.value,
        supplier: product.supplier,
        version: product.version,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.client.product.findUnique({ where: { id }, include: productInclude });
    return row ? this.toDomain(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await this.client.product.findUnique({ where: { sku }, include: productInclude });
    return row ? this.toDomain(row) : null;
  }

  async findCategoryByName(name: string): Promise<{ id: string; name: string } | null> {
    return this.client.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
  }

  async updateStock(product: Product, expectedVersion: number): Promise<void> {
    const result = await this.client.product.updateMany({
      where: { id: product.id, version: expectedVersion },
      data: { currentStock: product.currentStock.value, version: { increment: 1 } },
    });
    if (result.count !== 1)
      throw new DomainError(
        'CONCURRENT_MODIFICATION',
        'El stock cambió durante la operación; reintente',
      );
  }

  async findInventory(filters: InventoryFilters): Promise<Product[]> {
    const rows = await this.client.product.findMany({
      where: {
        ...(filters.category && {
          category: { name: { equals: filters.category, mode: 'insensitive' } },
        }),
        ...(filters.supplier && { supplier: { equals: filters.supplier, mode: 'insensitive' } }),
        ...((filters.minimumStock !== undefined || filters.maximumStock !== undefined) && {
          currentStock: { gte: filters.minimumStock, lte: filters.maximumStock },
        }),
        ...(filters.hasActiveAlert !== undefined && {
          alerts: filters.hasActiveAlert
            ? { some: { status: 'ACTIVA' } }
            : { none: { status: 'ACTIVA' } },
        }),
      },
      include: productInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: ProductRow): Product {
    return Product.rehydrate({
      id: row.id,
      sku: new Sku(row.sku),
      name: row.name,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      price: new Money(Number(row.price)),
      currentStock: new Stock(row.currentStock),
      minimumStock: new Quantity(row.minimumStock),
      supplier: row.supplier,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
