import { ArgumentsHost, Injectable } from '@nestjs/common';

type ExceptionHandler<T extends Error> = (
  exception: T,
  host: ArgumentsHost,
) => void;
type ExceptionConstructor<T extends Error = Error> = abstract new (
  ...args: any[]
) => T;

@Injectable()
export class ExceptionHandlerService {
  private handlers = new Map<ExceptionConstructor, ExceptionHandler<Error>>();

  register<T extends Error>(
    exceptionType: ExceptionConstructor<T>,
    handler: ExceptionHandler<T>,
  ) {
    this.handlers.set(exceptionType, handler as ExceptionHandler<Error>);
  }

  getHandler<T extends Error>(exception: T): ExceptionHandler<T> | undefined {
    let current: ExceptionConstructor | null =
      exception.constructor as ExceptionConstructor;

    while (current) {
      const handler = this.handlers.get(current);
      if (handler) {
        return handler as ExceptionHandler<T>;
      }
      current = Object.getPrototypeOf(current) as ExceptionConstructor | null;
    }

    return undefined;
  }
}
