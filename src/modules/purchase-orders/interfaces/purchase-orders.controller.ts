import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { presentOrder } from '../../../shared/interfaces/presenters';
import { ApprovePurchaseOrderUseCase } from '../application/approve-purchase-order.use-case';
import { CreatePurchaseOrderUseCase } from '../application/create-purchase-order.use-case';
import { ListPurchaseOrdersUseCase } from '../application/list-purchase-orders.use-case';
import { ReceivePurchaseOrderUseCase } from '../application/receive-purchase-order.use-case';
import { RejectPurchaseOrderUseCase } from '../application/reject-purchase-order.use-case';
import {
  CreatePurchaseOrderDto,
  PurchaseOrdersQueryDto,
  RejectPurchaseOrderDto,
} from './purchase-orders.dto';

@ApiTags('Órdenes de compra')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    @Inject(CreatePurchaseOrderUseCase) private readonly createOrder: CreatePurchaseOrderUseCase,
    @Inject(ListPurchaseOrdersUseCase) private readonly listOrders: ListPurchaseOrdersUseCase,
    @Inject(ApprovePurchaseOrderUseCase) private readonly approveOrder: ApprovePurchaseOrderUseCase,
    @Inject(RejectPurchaseOrderUseCase) private readonly rejectOrder: RejectPurchaseOrderUseCase,
    @Inject(ReceivePurchaseOrderUseCase) private readonly receiveOrder: ReceivePurchaseOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden manual o asociada a una alerta activa' })
  @ApiBody({
    type: CreatePurchaseOrderDto,
    examples: {
      manual: { value: { productId: '01977d65-75c8-7000-8000-000000000001', quantity: 100 } },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Orden creada en estado PENDIENTE',
    schema: { example: { id: '0197...', status: 'PENDIENTE', requestedAmount: 100 } },
  })
  @ApiResponse({ status: 422, description: 'Cantidad menor a dos veces el stock mínimo' })
  async create(@Body() body: CreatePurchaseOrderDto): Promise<Record<string, unknown>> {
    return presentOrder(await this.createOrder.execute(body));
  }

  @Get()
  @ApiOperation({ summary: 'Consultar órdenes de compra por estado' })
  @ApiResponse({
    status: 200,
    description: 'Listado de órdenes',
    schema: { example: [{ status: 'PENDIENTE', requestedAmount: 100 }] },
  })
  async find(@Query() query: PurchaseOrdersQueryDto): Promise<Record<string, unknown>[]> {
    return (await this.listOrders.execute(query.status)).map(presentOrder);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprobar una orden PENDIENTE' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ required: false, description: 'La aprobación no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Orden aprobada',
    schema: { example: { id: '0197...', status: 'APROBADA' } },
  })
  @ApiResponse({ status: 422, description: 'La orden no está PENDIENTE' })
  async approve(@Param('id', new ParseUUIDPipe()) id: string): Promise<Record<string, unknown>> {
    return presentOrder(await this.approveOrder.execute(id));
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rechazar una orden PENDIENTE con motivo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({
    type: RejectPurchaseOrderDto,
    examples: { rejection: { value: { reason: 'El proveedor no tiene disponibilidad' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Orden rechazada',
    schema: {
      example: {
        id: '0197...',
        status: 'RECHAZADA',
        rejectionReason: 'El proveedor no tiene disponibilidad',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Motivo menor a 10 caracteres' })
  async reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: RejectPurchaseOrderDto,
  ): Promise<Record<string, unknown>> {
    return presentOrder(await this.rejectOrder.execute(id, body.reason));
  }

  @Patch(':id/receive')
  @ApiOperation({
    summary: 'Recibir una orden APROBADA',
    description:
      'Incrementa el stock, registra un movimiento y resuelve la alerta cuando corresponde.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ required: false, description: 'La recepción no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Orden recibida',
    schema: {
      example: { id: '0197...', status: 'RECIBIDA', receivedAt: '2026-07-02T12:00:00.000Z' },
    },
  })
  @ApiResponse({ status: 422, description: 'La orden no está APROBADA' })
  async receive(@Param('id', new ParseUUIDPipe()) id: string): Promise<Record<string, unknown>> {
    return presentOrder(await this.receiveOrder.execute(id));
  }
}
