import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductUseCase } from '../application/create-product.use-case';
import { ListProductsUseCase } from '../application/list-products.use-case';
import { CreateProductDto } from './create-product.dto';
import { presentProduct } from '../../../shared/interfaces/presenters';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(CreateProductUseCase) private readonly createProduct: CreateProductUseCase,
    @Inject(ListProductsUseCase) private readonly listProducts: ListProductsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar todos los productos' })
  @ApiBody({ required: false, description: 'Este endpoint no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'Listado de productos',
    schema: {
      example: [
        {
          id: '01977d65-75c8-7000-8000-000000000001',
          sku: 'BEB-001',
          name: 'Agua Mineral 500ml',
          category: { id: '0197...', name: 'Bebidas' },
          price: 1500,
          currentStock: 150,
          minimumStock: 50,
          supplier: 'Distribuidora Andina',
        },
      ],
    },
  })
  async findAll(): Promise<Record<string, unknown>[]> {
    return (await this.listProducts.execute()).map(presentProduct);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar un producto',
    description:
      'Crea el producto con el stock inicial informado o cero cuando se omite, y genera una alerta cuando es menor o igual al mínimo.',
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      product: {
        value: {
          name: 'Café Molido 500g',
          sku: 'GRA-003',
          category: 'Granos',
          price: 18500,
          currentStock: 0,
          minimumStock: 20,
          supplier: 'Café Colombia S.A.S.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado',
    schema: { example: { id: '0197...', sku: 'GRA-003', currentStock: 0, minimumStock: 20 } },
  })
  @ApiResponse({ status: 409, description: 'SKU duplicado' })
  async create(@Body() body: CreateProductDto): Promise<Record<string, unknown>> {
    return presentProduct(await this.createProduct.execute(body));
  }
}
