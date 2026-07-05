import { Prisma, type PrismaClient } from '@prisma/client';
import { Quantity } from '../../../shared/domain/value-objects';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  type PurchaseOrderProps,
} from '../domain/purchase-order';
import type { PurchaseOrderRepository } from '../domain/purchase-order.repository';

type Client = PrismaClient | Prisma.TransactionClient;

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly client: Client) {}
  async create(order: PurchaseOrder): Promise<void> {
    await this.client.purchaseOrder.create({ data: this.data(order) });
  }
  async findById(id: string): Promise<PurchaseOrder | null> {
    const row = await this.client.purchaseOrder.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }
  async update(order: PurchaseOrder): Promise<void> {
    await this.client.purchaseOrder.update({
      where: { id: order.id },
      data: {
        status: order.status,
        rejectionReason: order.rejectionReason,
        updatedAt: order.updatedAt,
        receivedAt: order.receivedAt,
      },
    });
  }
  async findMany(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const rows = await this.client.purchaseOrder.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }
  private data(order: PurchaseOrder): Prisma.PurchaseOrderUncheckedCreateInput {
    return {
      id: order.id,
      productId: order.productId,
      alertId: order.alertId,
      supplier: order.supplier,
      requestedAmount: order.requestedAmount.value,
      status: order.status,
      rejectionReason: order.rejectionReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      receivedAt: order.receivedAt,
    };
  }
  private toDomain(row: {
    id: string;
    productId: string;
    alertId: string | null;
    supplier: string;
    requestedAmount: number;
    status: string;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    receivedAt: Date | null;
  }): PurchaseOrder {
    const statuses = Object.values(PurchaseOrderStatus) as string[];
    const props: PurchaseOrderProps = {
      id: row.id,
      productId: row.productId,
      alertId: row.alertId,
      supplier: row.supplier,
      requestedAmount: new Quantity(row.requestedAmount),
      status: (statuses.includes(row.status)
        ? row.status
        : PurchaseOrderStatus.PENDING) as PurchaseOrderStatus,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      receivedAt: row.receivedAt,
    };
    return PurchaseOrder.rehydrate(props);
  }
}
