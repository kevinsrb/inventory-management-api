import { v7 as uuidv7 } from 'uuid';
import { CreateProductUseCase } from '../../src/modules/products/application/create-product.use-case';
import { ListProductsUseCase } from '../../src/modules/products/application/list-products.use-case';
import { AdjustInventoryUseCase } from '../../src/modules/inventory/application/adjust-inventory.use-case';
import { MovementType } from '../../src/modules/inventory/domain/inventory';
import { CloseStockAlertUseCase } from '../../src/modules/alerts/application/close-stock-alert.use-case';
import { AlertStatus, StockAlert } from '../../src/modules/alerts/domain/stock-alert';
import { CreatePurchaseOrderUseCase } from '../../src/modules/purchase-orders/application/create-purchase-order.use-case';
import { ApprovePurchaseOrderUseCase } from '../../src/modules/purchase-orders/application/approve-purchase-order.use-case';
import { RejectPurchaseOrderUseCase } from '../../src/modules/purchase-orders/application/reject-purchase-order.use-case';
import { ReceivePurchaseOrderUseCase } from '../../src/modules/purchase-orders/application/receive-purchase-order.use-case';
import { PurchaseOrderStatus } from '../../src/modules/purchase-orders/domain/purchase-order';
import { InMemoryUnitOfWork } from '../helpers/in-memory-unit-of-work';

describe('Casos de uso de inventario', () => {
  let uow: InMemoryUnitOfWork;
  beforeEach(() => {
    uow = new InMemoryUnitOfWork();
  });

  it('crea un producto con stock cero y una alerta activa', async () => {
    const product = await new CreateProductUseCase(uow).execute({
      name: 'Café de Colombia',
      sku: 'GRA-003',
      category: 'Granos',
      price: 18000,
      minimumStock: 20,
      supplier: 'Cafetera Nacional',
    });
    expect(product.currentStock.value).toBe(0);
    expect(uow.store.alerts).toHaveLength(1);
    expect(uow.store.alerts[0]?.status).toBe(AlertStatus.ACTIVE);
  });

  it('rechaza un SKU duplicado', async () => {
    uow.store.product(10, 5, 'BEB-999');
    await expect(
      new CreateProductUseCase(uow).execute({
        name: 'Producto repetido',
        sku: 'beb-999',
        category: 'Bebidas',
        price: 1000,
        minimumStock: 2,
        supplier: 'Proveedor',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('respeta el stock inicial y no crea alerta cuando supera el mínimo', async () => {
    const product = await new CreateProductUseCase(uow).execute({
      name: 'Café con existencias',
      sku: 'GRA-004',
      category: 'Granos',
      price: 19000,
      currentStock: 25,
      minimumStock: 20,
      supplier: 'Cafetera Nacional',
    });
    expect(product.currentStock.value).toBe(25);
    expect(uow.store.alerts).toHaveLength(0);
  });

  it('consulta todos los productos', async () => {
    uow.store.product(10, 5, 'BEB-998');
    uow.store.product(20, 8, 'BEB-997');
    const products = await new ListProductsUseCase(uow.repositories.products).execute();
    expect(products).toHaveLength(2);
  });

  it('registra una entrada y aumenta el stock', async () => {
    const product = uow.store.product(10, 5);
    const updated = await new AdjustInventoryUseCase(uow).execute({
      productId: product.id,
      type: MovementType.ENTRY,
      quantity: 4,
      reason: 'Recepción manual',
    });
    expect(updated.currentStock.value).toBe(14);
    expect(uow.store.movements[0]?.type).toBe(MovementType.ENTRY);
  });

  it('registra una salida y disminuye el stock', async () => {
    const product = uow.store.product(10, 5);
    const updated = await new AdjustInventoryUseCase(uow).execute({
      productId: product.id,
      type: MovementType.EXIT,
      quantity: 4,
      reason: 'Venta mostrador',
    });
    expect(updated.currentStock.value).toBe(6);
    expect(uow.store.movements[0]?.type).toBe(MovementType.EXIT);
  });

  it('rechaza stock negativo e informa el faltante', async () => {
    const product = uow.store.product(3, 2);
    await expect(
      new AdjustInventoryUseCase(uow).execute({
        productId: product.id,
        type: MovementType.EXIT,
        quantity: 5,
        reason: 'Venta mostrador',
      }),
    ).rejects.toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', details: { shortage: 2 } });
    expect(uow.store.movements).toHaveLength(0);
  });

  it('crea una alerta al bajar hasta el mínimo', async () => {
    const product = uow.store.product(12, 10);
    await new AdjustInventoryUseCase(uow).execute({
      productId: product.id,
      type: MovementType.EXIT,
      quantity: 2,
      reason: 'Venta mostrador',
    });
    expect(uow.store.alerts).toHaveLength(1);
  });

  it('no duplica una alerta activa en ajustes sucesivos', async () => {
    const product = uow.store.product(12, 10);
    const useCase = new AdjustInventoryUseCase(uow);
    await useCase.execute({
      productId: product.id,
      type: MovementType.EXIT,
      quantity: 2,
      reason: 'Primera venta',
    });
    await useCase.execute({
      productId: product.id,
      type: MovementType.EXIT,
      quantity: 1,
      reason: 'Segunda venta',
    });
    expect(uow.store.alerts).toHaveLength(1);
  });

  it('cierra explícitamente una alerta activa', async () => {
    const product = uow.store.product(5, 10);
    const alert = StockAlert.create(uuidv7(), product.id);
    uow.store.alerts.push(alert);
    const resolved = await new CloseStockAlertUseCase(uow).execute(alert.id);
    expect(resolved.status).toBe(AlertStatus.RESOLVED);
    expect(resolved.resolvedAt).toBeInstanceOf(Date);
  });
});

describe('Casos de uso de órdenes de compra', () => {
  let uow: InMemoryUnitOfWork;
  beforeEach(() => {
    uow = new InMemoryUnitOfWork();
  });

  it('crea una orden manual PENDIENTE con el proveedor del producto', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    expect(order.status).toBe(PurchaseOrderStatus.PENDING);
    expect(order.supplier).toBe(product.supplier);
  });

  it('rechaza una orden menor a dos veces el stock mínimo', async () => {
    const product = uow.store.product(5, 10);
    await expect(
      new CreatePurchaseOrderUseCase(uow).execute({ productId: product.id, quantity: 19 }),
    ).rejects.toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', details: { minimum: 20 } });
  });

  it('aprueba únicamente una orden pendiente', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    const approved = await new ApprovePurchaseOrderUseCase(uow).execute(order.id);
    expect(approved.status).toBe(PurchaseOrderStatus.APPROVED);
    await expect(new ApprovePurchaseOrderUseCase(uow).execute(order.id)).rejects.toMatchObject({
      code: 'BUSINESS_RULE_VIOLATION',
    });
  });

  it('rechaza una orden pendiente con un motivo válido', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    const rejected = await new RejectPurchaseOrderUseCase(uow).execute(
      order.id,
      'Proveedor sin existencias',
    );
    expect(rejected.status).toBe(PurchaseOrderStatus.REJECTED);
    expect(rejected.rejectionReason).toBe('Proveedor sin existencias');
  });

  it('exige al menos 10 caracteres para rechazar', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    await expect(
      new RejectPurchaseOrderUseCase(uow).execute(order.id, 'No hay'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('recibe una orden aprobada, actualiza stock y registra movimiento', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    await new ApprovePurchaseOrderUseCase(uow).execute(order.id);
    const received = await new ReceivePurchaseOrderUseCase(uow).execute(order.id);
    expect(received.status).toBe(PurchaseOrderStatus.RECEIVED);
    expect(uow.store.products[0]?.currentStock.value).toBe(25);
    expect(uow.store.movements).toHaveLength(1);
  });

  it('cierra automáticamente la alerta cuando la recepción supera el mínimo', async () => {
    const product = uow.store.product(5, 10);
    const alert = StockAlert.create(uuidv7(), product.id);
    uow.store.alerts.push(alert);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
      alertId: alert.id,
    });
    await new ApprovePurchaseOrderUseCase(uow).execute(order.id);
    await new ReceivePurchaseOrderUseCase(uow).execute(order.id);
    expect(uow.store.alerts[0]?.status).toBe(AlertStatus.RESOLVED);
  });

  it('no permite recibir una orden no aprobada', async () => {
    const product = uow.store.product(5, 10);
    const order = await new CreatePurchaseOrderUseCase(uow).execute({
      productId: product.id,
      quantity: 20,
    });
    await expect(new ReceivePurchaseOrderUseCase(uow).execute(order.id)).rejects.toMatchObject({
      code: 'BUSINESS_RULE_VIOLATION',
    });
  });
});
