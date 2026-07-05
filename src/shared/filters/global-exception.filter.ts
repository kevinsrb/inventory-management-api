import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { DomainError } from '../exceptions/domain.error';

const statusByCode = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  BUSINESS_RULE_VIOLATION: HttpStatus.UNPROCESSABLE_ENTITY,
  CONCURRENT_MODIFICATION: HttpStatus.CONFLICT,
} as const;

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    super(adapterHost.httpAdapter);
    logger.setContext(GlobalExceptionFilter.name);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof DomainError) {
      const response = host.switchToHttp().getResponse<unknown>();
      const request = host.switchToHttp().getRequest<{ url: string }>();
      const status = statusByCode[exception.code];
      this.adapterHost.httpAdapter.reply(
        response,
        {
          statusCode: status,
          code: exception.code,
          message: exception.message,
          details: exception.details,
          path: request.url,
          timestamp: new Date().toISOString(),
        },
        status,
      );
      return;
    }
    if (!(exception instanceof HttpException)) this.logger.error(exception, 'Error no controlado');
    super.catch(exception, host);
  }
}
