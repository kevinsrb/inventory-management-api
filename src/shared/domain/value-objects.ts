import { DomainError } from '../exceptions/domain.error';

export class Sku {
  private static readonly PATTERN = /^[A-Za-z0-9-]{6,20}$/;
  public readonly value: string;

  constructor(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!Sku.PATTERN.test(normalized)) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El SKU debe ser alfanumérico, admitir guion y tener entre 6 y 20 caracteres',
      );
    }
    this.value = normalized;
  }
}

export class Money {
  public readonly amount: number;

  constructor(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new DomainError('VALIDATION_ERROR', 'El precio debe ser mayor que cero');
    }
    this.amount = Math.round(amount * 100) / 100;
  }
}

export class Quantity {
  public readonly value: number;

  constructor(value: number) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new DomainError('VALIDATION_ERROR', 'La cantidad debe ser un entero mayor que cero');
    }
    this.value = value;
  }
}

export class Stock {
  public readonly value: number;

  constructor(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El stock debe ser un entero mayor o igual que cero',
      );
    }
    this.value = value;
  }
}
