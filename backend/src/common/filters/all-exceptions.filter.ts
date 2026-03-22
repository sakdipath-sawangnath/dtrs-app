import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let details: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      
      // Handle standard HttpException structure including ValidationPipe responses
      if (typeof response === 'object' && response !== null && 'message' in response) {
        message = Array.isArray((response as any).message) 
          ? (response as any).message.join(', ')
          : (response as any).message;
          
        if (Array.isArray((response as any).message)) {
          details = (response as any).message;
          code = 'VALIDATION_ERROR';
        } else {
          code = (response as any).error || 'HTTP_ERROR';
        }
      } else {
        message = exception.message;
        code = 'HTTP_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown Exception: ${String(exception)}`);
    }

    const responseBody = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
