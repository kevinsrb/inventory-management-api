import { Money, Quantity, Sku, Stock } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';

export interface ProductProps {
  id: string;
  sku: Sku;
  name: string;
  categoryId: string;
  categoryName: string;
  price: Money;
  currentStock: Stock;
  minimumStock: Quantity;
  supplier: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(input: Omit<ProductProps, 'version' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date();
    return Product.rehydrate({
      ...input,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: ProductProps): Product {
    const name = props.name.trim();
    const supplier = props.supplier.trim();
    if (name.length < 3 || name.length > 100) {
      throw new DomainError('VALIDATION_ERROR', 'El nombre debe tener entre 3 y 100 caracteres');
    }
    if (!supplier) throw new DomainError('VALIDATION_ERROR', 'El proveedor es obligatorio');
    if (!props.categoryName.trim())
      throw new DomainError('VALIDATION_ERROR', 'La categoría es obligatoria');
    return new Product({ ...props, name, supplier });
  }

  withStock(stock: Stock): Product {
    return Product.rehydrate({
      ...this.props,
      currentStock: stock,
      version: this.version + 1,
      updatedAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get sku(): Sku {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get categoryName(): string {
    return this.props.categoryName;
  }
  get price(): Money {
    return this.props.price;
  }
  get currentStock(): Stock {
    return this.props.currentStock;
  }
  get minimumStock(): Quantity {
    return this.props.minimumStock;
  }
  get supplier(): string {
    return this.props.supplier;
  }
  get version(): number {
    return this.props.version;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
