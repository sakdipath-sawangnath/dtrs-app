import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MulterError } from 'multer';

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
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
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

      const text = String(message ?? '');
      if (text.includes('Unexpected field')) {
        httpStatus = HttpStatus.BAD_REQUEST;
        code = 'VALIDATION_ERROR';
        message = 'อัปโหลดรูปได้สูงสุด 3 รูป';
      } else if (httpStatus === HttpStatus.PAYLOAD_TOO_LARGE) {
        httpStatus = HttpStatus.BAD_REQUEST;
        code = 'VALIDATION_ERROR';
        message = 'ไฟล์รูปใหญ่เกิน 5MB';
      }
    } else if (exception instanceof MulterError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      if (exception.code === 'LIMIT_FILE_SIZE') {
        message = 'ไฟล์รูปใหญ่เกิน 5MB';
      } else if (
        exception.code === 'LIMIT_FILE_COUNT' ||
        exception.code === 'LIMIT_UNEXPECTED_FILE'
      ) {
        message = 'อัปโหลดรูปได้สูงสุด 3 รูป';
      } else if (exception.message?.includes('Unexpected field')) {
        message = 'อัปโหลดรูปได้สูงสุด 3 รูป';
      } else {
        message = exception.message;
      }
    } else if (
      exception instanceof Error &&
      exception.message.includes('Unexpected field')
    ) {
      httpStatus = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'อัปโหลดรูปได้สูงสุด 3 รูป';
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
