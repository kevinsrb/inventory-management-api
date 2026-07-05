import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Environment } from './shared/config/environment';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { AppValidationPipe } from './shared/validation/app-validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Environment, true>);
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.enableCors();
  const httpServer = app.getHttpAdapter().getInstance() as { disable(name: string): void };
  httpServer.disable('x-powered-by');
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalInterceptors(app.get(LoggingInterceptor));
  app.useGlobalFilters(app.get(GlobalExceptionFilter));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MercadoExpress - API de Inventario')
    .setDescription('Gestión de productos, stock, alertas y órdenes de compra')
    .setVersion('1.0.0')
    .addServer('/api')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    customSiteTitle: 'MercadoExpress API',
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void bootstrap();
