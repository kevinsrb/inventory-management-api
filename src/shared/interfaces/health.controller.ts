import { Controller, Get } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprobar que la API está lista para recibir tráfico' })
  @ApiBody({ required: false, description: 'Este endpoint no requiere cuerpo.' })
  @ApiResponse({
    status: 200,
    description: 'API disponible',
    schema: { example: { status: 'ok' } },
  })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
