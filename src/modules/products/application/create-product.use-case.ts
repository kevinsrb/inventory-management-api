import { v7 as uuidv7 } from 'uuid';
import { Money, Quantity, Sku, Stock } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import type { UnitOfWork } from '../../../shared/application/ports';
import { StockAlert, StockAlertPolicy } from '../../alerts/domain/stock-alert';
import { Product } from '../domain/product';

export interface CreateProductCommand {
  name: string;
  sku: string;
  category: string;
  price: number;
  currentStock?: number;
  minimumStock: number;
  supplier: string;
}

export class CreateProductUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: CreateProductCommand): Promise<Product> {
    return this.unitOfWork.execute(async ({ products, alerts }) => {
      const sku = new Sku(command.sku);
      if (await products.findBySku(sku.value)) {
        throw new DomainError('CONFLICT', `Ya existe un producto con SKU ${sku.value}`);
      }
      const category = await products.findCategoryByName(command.category.trim());
      if (!category)
        throw new DomainError('NOT_FOUND', `No existe la categoría ${command.category}`);

      const product = Product.create({
        id: uuidv7(),
        sku,
        name: command.name,
        categoryId: category.id,
        categoryName: category.name,
        price: new Money(command.price),
        currentStock: new Stock(command.currentStock ?? 0),
        minimumStock: new Quantity(command.minimumStock),
        supplier: command.supplier,
      });
      await products.create(product);
      if (StockAlertPolicy.requiresActiveAlert(product)) {
        await alerts.create(StockAlert.create(uuidv7(), product.id));
      }
      return product;
    });
  }
}
