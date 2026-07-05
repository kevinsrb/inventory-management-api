import { Prisma, type PrismaClient } from '@prisma/client';
import type { AlertRepository } from '../domain/alert.repository';
import { AlertStatus, AlertType, StockAlert, type StockAlertProps } from '../domain/stock-alert';

type Client = PrismaClient | Prisma.TransactionClient;

export class PrismaAlertRepository implements AlertRepository {
  constructor(private readonly client: Client) {}
  async create(alert: StockAlert): Promise<void> {
    await this.client.stockAlert.create({
      data: {
        id: alert.id,
        productId: alert.productId,
        type: alert.type,
        status: alert.status,
        createdAt: alert.createdAt,
        resolvedAt: alert.resolvedAt,
      },
    });
  }
  async findById(id: string): Promise<StockAlert | null> {
    const row = await this.client.stockAlert.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }
  async findActiveByProduct(productId: string): Promise<StockAlert | null> {
    const row = await this.client.stockAlert.findFirst({
      where: { productId, status: AlertStatus.ACTIVE },
    });
    return row ? this.toDomain(row) : null;
  }
  async resolve(alert: StockAlert): Promise<void> {
    await this.client.stockAlert.update({
      where: { id: alert.id },
      data: { status: alert.status, resolvedAt: alert.resolvedAt },
    });
  }
  async findMany(status?: AlertStatus): Promise<StockAlert[]> {
    const rows = await this.client.stockAlert.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }
  private toDomain(row: {
    id: string;
    productId: string;
    type: string;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }): StockAlert {
    const props: StockAlertProps = {
      id: row.id,
      productId: row.productId,
      type: AlertType.LOW_STOCK,
      status: row.status === AlertStatus.ACTIVE ? AlertStatus.ACTIVE : AlertStatus.RESOLVED,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    };
    return StockAlert.rehydrate(props);
  }
}
