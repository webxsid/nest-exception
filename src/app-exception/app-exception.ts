// src/app-exception.ts
import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ErrorRegistryService } from './error-registry/error-registry.service';

export class AppException extends HttpException {
  public readonly code: string;
  public readonly trace?: string;

  constructor(
    errorOrCode: string,
    trace?: string,
    @Inject('IS_DEV') private readonly isDev?: boolean,
    @Inject(ErrorRegistryService)
    private readonly errorRegistryService?: ErrorRegistryService,
  ) {
    const error = errorRegistryService?.getError(errorOrCode);
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';

    if (error) {
      statusCode = error.statusCode;
      message = error.message;
    } else {
      message = errorOrCode;
    }

    super(message, statusCode);
    this.code = error ? error.code : 'UNKNOWN_ERROR';
    this.trace = this.isDev ? trace : undefined;
  }
}
