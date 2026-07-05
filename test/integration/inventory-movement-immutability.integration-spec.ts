import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

describe('Inmutabilidad del historial de inventario (PostgreSQL)', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL es obligatoria para ejecutar los tests de integración');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const categoryId = uuidv7();
  const productId = uuidv7();
  const movementId = uuidv7();

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.category.create({
      data: { id: categoryId, name: `Integración ${categoryId}` },
    });
    await prisma.product.create({
      data: {
        id: productId,
        sku: `TST-${productId.replaceAll('-', '').slice(0, 12)}`,
        name: 'Producto para historial inmutable',
        categoryId,
        price: 1000,
        currentStock: 10,
        minimumStock: 5,
        supplier: 'Proveedor de integración',
      },
    });
    await prisma.inventoryMovement.create({
      data: {
        id: movementId,
        productId,
        type: 'ENTRADA',
        quantity: 10,
        reason: 'Movimiento original',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rechaza la edición de un movimiento existente', async () => {
    await expect(
      prisma.inventoryMovement.update({
        where: { id: movementId },
        data: { quantity: 99, reason: 'Movimiento alterado' },
      }),
    ).rejects.toThrow('El historial de inventario es inmutable');

    const movement = await prisma.inventoryMovement.findUniqueOrThrow({
      where: { id: movementId },
    });
    expect(movement.quantity).toBe(10);
    expect(movement.reason).toBe('Movimiento original');
  });

  it('rechaza la eliminación de un movimiento existente', async () => {
    await expect(prisma.inventoryMovement.delete({ where: { id: movementId } })).rejects.toThrow(
      'El historial de inventario es inmutable',
    );

    await expect(
      prisma.inventoryMovement.findUniqueOrThrow({ where: { id: movementId } }),
    ).resolves.toMatchObject({ id: movementId });
  });
});
