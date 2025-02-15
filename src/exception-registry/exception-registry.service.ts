import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppExceptionProviderKeys } from '../constant';

interface AppError {
  id: string;
  code: string;
  statusCode: HttpStatus;
  message: string;
}

@Injectable()
export class ExceptionRegistryService {
  private errors: Map<string, AppError> = new Map();

  constructor(
    @Inject(AppExceptionProviderKeys.Errors)
    private readonly predefinedErrors: AppError[] = [],
  ) {
    this.predefinedErrors.forEach((error) =>
      this.registerError(error.code, error.statusCode, error.message),
    );
  }

  registerError(code: string, statusCode: HttpStatus, message: string): string {
    if (this.errors.has(code)) {
      return this.errors.get(code)!.id;
    }

    const id = `ERR-${this.errors.size + 1}`; // Unique per instance
    this.errors.set(code, { id, code, statusCode, message });
    return id;
  }

  getError(code: string): AppError | undefined {
    return this.errors.get(code);
  }
}
