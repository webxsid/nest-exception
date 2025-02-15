// src/global-app-exception/global-app-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../app-exception';
import { ExceptionHandlerService } from '../exception-handler';
import { AppExceptionProviderKeys } from '../constant';

export interface AppErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  path: string;
  timestamp: string;
  trace?: string | string[];
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(AppExceptionProviderKeys.IsDevMode) private readonly isDev: boolean,
    @Inject(AppExceptionProviderKeys.Logger)
    private readonly logger: LoggerService | null,
    @Inject(ExceptionHandlerService)
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const handler = this.exceptionHandlerService.getHandler(exception);
    if (handler) {
      return handler(exception, host);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let trace: string | undefined;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      message = exception.message;
      trace = exception.trace;
      errorCode = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseContent = exception.getResponse();
      if (typeof responseContent === 'string') {
        message = responseContent;
      } else if (
        typeof responseContent === 'object' &&
        responseContent !== null
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message = // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (responseContent as any).message || JSON.stringify(responseContent);
      }
    }

    const errorResponse: AppErrorResponse = {
      statusCode: status,
      errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (this.isDev && trace) {
      errorResponse.trace = trace;
    }

    if (this.logger) {
      this.logger.error({ message, errorCode, path: request.url, trace });
    }

    response.status(status).json(errorResponse);
  }
}
