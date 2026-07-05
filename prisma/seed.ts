import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

const prisma = new PrismaClient();

const categoryNames = ['Bebidas', 'Lácteos', 'Snacks', 'Limpieza', 'Frutas', 'Granos'];
const products = [
  {
    sku: 'BEB-001',
    name: 'Agua Mineral 500ml',
    category: 'Bebidas',
    price: 1500,
    stock: 150,
    minimumStock: 50,
    supplier: 'Distribuidora Andina',
  },
  {
    sku: 'BEB-002',
    name: 'Jugo de Naranja 1L',
    category: 'Bebidas',
    price: 3200,
    stock: 30,
    minimumStock: 40,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'LAC-001',
    name: 'Leche Entera 1L',
    category: 'Lácteos',
    price: 2100,
    stock: 200,
    minimumStock: 60,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'LAC-002',
    name: 'Yogur Natural 500g',
    category: 'Lácteos',
    price: 2800,
    stock: 15,
    minimumStock: 25,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'SNA-001',
    name: 'Papas Fritas 200g',
    category: 'Snacks',
    price: 2500,
    stock: 80,
    minimumStock: 30,
    supplier: 'SnacksCorp',
  },
  {
    sku: 'LIM-001',
    name: 'Detergente 1L',
    category: 'Limpieza',
    price: 4500,
    stock: 45,
    minimumStock: 20,
    supplier: 'Químicos del Sur',
  },
] as const;

async function seed(): Promise<void> {
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { id: uuidv7(), name },
    });
    categories.set(name, category.id);
  }

  for (const item of products) {
    await prisma.$transaction(async (transaction) => {
      const categoryId = categories.get(item.category);
      if (!categoryId) throw new Error(`Categoría de seed no encontrada: ${item.category}`);
      const existing = await transaction.product.findUnique({ where: { sku: item.sku } });
      const product = existing
        ? await transaction.product.update({
            where: { sku: item.sku },
            data: {
              name: item.name,
              categoryId,
              price: item.price,
              minimumStock: item.minimumStock,
              supplier: item.supplier,
            },
          })
        : await transaction.product.create({
            data: {
              id: uuidv7(),
              sku: item.sku,
              name: item.name,
              categoryId,
              price: item.price,
              currentStock: item.stock,
              minimumStock: item.minimumStock,
              supplier: item.supplier,
            },
          });

      if (product.currentStock <= product.minimumStock) {
        const active = await transaction.stockAlert.findFirst({
          where: { productId: product.id, status: 'ACTIVA' },
        });
        if (!active) {
          await transaction.stockAlert.create({
            data: { id: uuidv7(), productId: product.id, type: 'STOCK_BAJO', status: 'ACTIVA' },
          });
        }
      }
    });
  }
}

seed().finally(async () => prisma.$disconnect());
