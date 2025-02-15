import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionRegistryService } from '../exception-registry';
import { kDefaultErrorCode } from '../constant';

export class AppException extends HttpException {
  private static errorRegistryService?: ExceptionRegistryService;
  private static isDevMode = false;

  public readonly code: string;
  public readonly trace?: string;
  public readonly statusCode: number;

  constructor(errorOrCode: string, trace?: string) {
    super(
      AppException.createResponse(errorOrCode),
      AppException.getStatus(errorOrCode),
    );

    this.code = AppException.getCode(errorOrCode);
    this.statusCode = AppException.getStatus(errorOrCode);

    // Capture stack trace automatically if not provided
    this.trace = AppException.isDevMode
      ? (trace ?? new Error().stack)
      : undefined;
  }

  public static init(
    errorRegistryService: ExceptionRegistryService,
    isDev: boolean,
  ) {
    this.errorRegistryService = errorRegistryService;
    this.isDevMode = isDev;
  }

  private static getErrorRegistry(): ExceptionRegistryService {
    if (!this.errorRegistryService) {
      throw new Error(
        'AppException is not initialized. Call AppException.init() before using it.',
      );
    }
    return this.errorRegistryService;
  }

  private static getError(errorOrCode: string) {
    return AppException.getErrorRegistry().getError(errorOrCode);
  }

  private static getStatus(errorOrCode: string): number {
    return (
      AppException.getError(errorOrCode)?.statusCode ??
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private static getCode(errorOrCode: string): string {
    return AppException.getError(errorOrCode)?.code ?? kDefaultErrorCode;
  }

  private static createResponse(errorOrCode: string) {
    const error = AppException.getError(errorOrCode);
    return {
      message: error?.message ?? errorOrCode,
      statusCode: error?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      code: error?.code ?? kDefaultErrorCode,
    };
  }
}
