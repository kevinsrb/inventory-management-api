import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable, finalize } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    logger.setContext(LoggingInterceptor.name);
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const startedAt = Date.now();
    return next.handle().pipe(
      finalize(() =>
        this.logger.info(
          {
            method: request.method,
            path: request.url,
            durationMs: Date.now() - startedAt,
          },
          'Solicitud completada',
        ),
      ),
    );
  }
}
