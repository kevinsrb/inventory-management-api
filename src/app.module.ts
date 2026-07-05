import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AlertsModule } from './modules/alerts/alerts.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { validateEnvironment, type Environment } from './shared/config/environment';
import { DatabaseModule } from './shared/database/database.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnvironment }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          quietReqLogger: true,
        },
      }),
    }),
    DatabaseModule,
    ProductsModule,
    InventoryModule,
    AlertsModule,
    PurchaseOrdersModule,
  ],
  providers: [LoggingInterceptor, GlobalExceptionFilter],
})
export class AppModule {}
