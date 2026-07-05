import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { presentMovement, presentProduct } from '../../../shared/interfaces/presenters';
import { AdjustInventoryUseCase } from '../application/adjust-inventory.use-case';
import { GetInventoryUseCase } from '../application/get-inventory.use-case';
import { GetMovementsUseCase } from '../application/get-movements.use-case';
import { AdjustInventoryDto, InventoryQueryDto } from './inventory.dto';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject(AdjustInventoryUseCase) private readonly adjustInventory: AdjustInventoryUseCase,
    @Inject(GetInventoryUseCase) private readonly getInventory: GetInventoryUseCase,
    @Inject(GetMovementsUseCase) private readonly getMovements: GetMovementsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar inventario con filtros combinables' })
  @ApiBody({ required: false, description: 'Este endpoint no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Inventario filtrado',
    schema: { example: [{ sku: 'BEB-001', currentStock: 150, minimumStock: 50 }] },
  })
  async find(@Query() query: InventoryQueryDto): Promise<Record<string, unknown>[]> {
    return (await this.getInventory.execute(query)).map(presentProduct);
  }

  @Post(':productId/adjustments')
  @ApiOperation({ summary: 'Registrar una entrada o salida de inventario' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiBody({
    type: AdjustInventoryDto,
    examples: { exit: { value: { type: 'SALIDA', quantity: 5, reason: 'Venta en punto físico' } } },
  })
  @ApiResponse({
    status: 201,
    description: 'Stock ajustado y movimiento registrado',
    schema: { example: { id: '0197...', currentStock: 25 } },
  })
  @ApiResponse({ status: 422, description: 'El ajuste produciría stock negativo' })
  async adjust(
    @Param('productId', new ParseUUIDPipe({ version: '7' })) productId: string,
    @Body() body: AdjustInventoryDto,
  ): Promise<Record<string, unknown>> {
    return presentProduct(await this.adjustInventory.execute({ productId, ...body }));
  }

  @Get(':productId/movements')
  @ApiOperation({ summary: 'Consultar el historial inmutable de movimientos' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiBody({ required: false, description: 'Este endpoint no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Historial del producto',
    schema: { example: [{ type: 'ENTRADA', quantity: 10, reason: 'Recepción' }] },
  })
  async movements(
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ): Promise<Record<string, unknown>[]> {
    return (await this.getMovements.execute(productId)).map(presentMovement);
  }
}
