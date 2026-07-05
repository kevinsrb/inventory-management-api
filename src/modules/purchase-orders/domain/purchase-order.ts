import { Quantity } from '../../../shared/domain/value-objects';
import { DomainError } from '../../../shared/exceptions/domain.error';
import type { Product } from '../../products/domain/product';

export const PurchaseOrderStatus = {
  PENDING: 'PENDIENTE',
  APPROVED: 'APROBADA',
  REJECTED: 'RECHAZADA',
  RECEIVED: 'RECIBIDA',
} as const;
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export interface PurchaseOrderProps {
  id: string;
  productId: string;
  alertId: string | null;
  supplier: string;
  requestedAmount: Quantity;
  status: PurchaseOrderStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  receivedAt: Date | null;
}

export class PurchaseOrder {
  private constructor(private readonly props: PurchaseOrderProps) {}

  static create(
    input: Pick<
      PurchaseOrderProps,
      'id' | 'productId' | 'alertId' | 'supplier' | 'requestedAmount'
    >,
  ): PurchaseOrder {
    const now = new Date();
    return new PurchaseOrder({
      ...input,
      status: PurchaseOrderStatus.PENDING,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      receivedAt: null,
    });
  }

  static rehydrate(props: PurchaseOrderProps): PurchaseOrder {
    return new PurchaseOrder(props);
  }

  approve(): PurchaseOrder {
    this.assertPending();
    return PurchaseOrder.rehydrate({
      ...this.props,
      status: PurchaseOrderStatus.APPROVED,
      updatedAt: new Date(),
    });
  }

  reject(reason: string): PurchaseOrder {
    this.assertPending();
    const normalized = PurchaseOrderPolicy.validateRejectionReason(reason);
    return PurchaseOrder.rehydrate({
      ...this.props,
      status: PurchaseOrderStatus.REJECTED,
      rejectionReason: normalized,
      updatedAt: new Date(),
    });
  }

  receive(): PurchaseOrder {
    if (this.status !== PurchaseOrderStatus.APPROVED) {
      throw new DomainError('BUSINESS_RULE_VIOLATION', 'Solo se puede recibir una orden APROBADA');
    }
    const now = new Date();
    return PurchaseOrder.rehydrate({
      ...this.props,
      status: PurchaseOrderStatus.RECEIVED,
      updatedAt: now,
      receivedAt: now,
    });
  }

  private assertPending(): void {
    if (this.status !== PurchaseOrderStatus.PENDING) {
      throw new DomainError(
        'BUSINESS_RULE_VIOLATION',
        'Solo se pueden aprobar o rechazar órdenes PENDIENTES',
      );
    }
  }

  get id(): string {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get alertId(): string | null {
    return this.props.alertId;
  }
  get supplier(): string {
    return this.props.supplier;
  }
  get requestedAmount(): Quantity {
    return this.props.requestedAmount;
  }
  get status(): PurchaseOrderStatus {
    return this.props.status;
  }
  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get receivedAt(): Date | null {
    return this.props.receivedAt;
  }
}

export class PurchaseOrderPolicy {
  static validateMinimum(product: Product, quantity: Quantity): void {
    const minimum = product.minimumStock.value * 2;
    if (quantity.value < minimum) {
      throw new DomainError(
        'BUSINESS_RULE_VIOLATION',
        `La orden debe solicitar al menos ${minimum} unidades`,
        { minimum, requested: quantity.value },
      );
    }
  }

  static validateRejectionReason(reason: string): string {
    const normalized = reason.trim();
    if (normalized.length < 10 || normalized.length > 250) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El motivo de rechazo debe tener entre 10 y 250 caracteres',
      );
    }
    return normalized;
  }
}
