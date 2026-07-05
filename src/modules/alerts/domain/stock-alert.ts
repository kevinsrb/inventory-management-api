import type { Product } from '../../products/domain/product';
import { DomainError } from '../../../shared/exceptions/domain.error';

export const AlertStatus = { ACTIVE: 'ACTIVA', RESOLVED: 'RESUELTA' } as const;
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];
export const AlertType = { LOW_STOCK: 'STOCK_BAJO' } as const;

export interface StockAlertProps {
  id: string;
  productId: string;
  type: typeof AlertType.LOW_STOCK;
  status: AlertStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export class StockAlert {
  private constructor(private readonly props: StockAlertProps) {}

  static create(id: string, productId: string): StockAlert {
    return new StockAlert({
      id,
      productId,
      type: AlertType.LOW_STOCK,
      status: AlertStatus.ACTIVE,
      createdAt: new Date(),
      resolvedAt: null,
    });
  }

  static rehydrate(props: StockAlertProps): StockAlert {
    return new StockAlert(props);
  }

  resolve(at = new Date()): StockAlert {
    if (this.status !== AlertStatus.ACTIVE) {
      throw new DomainError('BUSINESS_RULE_VIOLATION', 'La alerta ya se encuentra resuelta');
    }
    return StockAlert.rehydrate({ ...this.props, status: AlertStatus.RESOLVED, resolvedAt: at });
  }

  get id(): string {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get type(): typeof AlertType.LOW_STOCK {
    return this.props.type;
  }
  get status(): AlertStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }
}

export class StockAlertPolicy {
  static requiresActiveAlert(product: Product): boolean {
    return product.currentStock.value <= product.minimumStock.value;
  }

  static canResolve(product: Product): boolean {
    return product.currentStock.value > product.minimumStock.value;
  }
}
