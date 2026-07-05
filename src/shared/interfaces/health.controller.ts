import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprobar que la API está lista para recibir tráfico' })
  @ApiResponse({
    status: 200,
    description: 'API disponible',
    schema: { example: { status: 'ok' } },
  })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
