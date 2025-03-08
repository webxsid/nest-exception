import {
  DynamicModule,
  Global,
  HttpStatus,
  LoggerService,
  Module,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { ExceptionRegistryService } from './exception-registry';
import { AppExceptionFilter } from './app-exception-filter';
import { APP_FILTER } from '@nestjs/core';
import { AppException } from './app-exception';
import { ExceptionHandlerService } from './exception-handler';
import { AppExceptionProviderKeys } from './constant';

export interface AppExceptionModuleOptions {
  errors?: { code: string; statusCode: HttpStatus; message: string }[];
  isDev?: boolean;
  logger?: LoggerService;
}

export interface AppExceptionModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<AppExceptionModuleOptions> | AppExceptionModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class AppExceptionModule implements OnModuleInit {
  constructor(private readonly errorRegistry: ExceptionRegistryService) {}

  static forRoot(options: AppExceptionModuleOptions = {}): DynamicModule {
    return {
      module: AppExceptionModule,
      global: true,
      providers: this.createProviders(options),
      exports: [
        AppExceptionProviderKeys.IsDevMode,
        AppExceptionProviderKeys.Errors,
        AppExceptionProviderKeys.Logger,
        ExceptionHandlerService,
        ExceptionRegistryService,
      ],
    };
  }

  static forRootAsync(options: AppExceptionModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      throw new Error('registerAsync requires a useFactory function.');
    }

    const asyncProvider: Provider = {
      provide: AppExceptionProviderKeys.ErrorOptions,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: AppExceptionModule,
      global: true,
      imports: options.imports || [],
      providers: [
        asyncProvider,
        {
          provide: AppExceptionProviderKeys.IsDevMode,
          useFactory: (opts: AppExceptionModuleOptions) => opts.isDev ?? false,
          inject: [AppExceptionProviderKeys.ErrorOptions],
        },
        {
          provide: AppExceptionProviderKeys.Errors,
          useFactory: (opts: AppExceptionModuleOptions) => opts.errors || [],
          inject: [AppExceptionProviderKeys.ErrorOptions],
        },
        {
          provide: AppExceptionProviderKeys.Logger,
          useFactory: (opts: AppExceptionModuleOptions) => opts.logger,
          inject: [AppExceptionProviderKeys.ErrorOptions],
        },
        ExceptionHandlerService,
        ExceptionRegistryService,
        {
          provide: APP_FILTER,
          useClass: AppExceptionFilter,
        },
      ],
      exports: [
        AppExceptionProviderKeys.IsDevMode,
        AppExceptionProviderKeys.Errors,
        AppExceptionProviderKeys.Logger,
        ExceptionHandlerService,
        ExceptionRegistryService,
      ],
    };
  }

  private static createProviders(
    options: AppExceptionModuleOptions,
  ): Provider[] {
    return [
      {
        provide: AppExceptionProviderKeys.IsDevMode,
        useValue: options.isDev ?? false,
      },
      {
        provide: AppExceptionProviderKeys.Errors,
        useValue: options.errors || [],
      },
      {
        provide: AppExceptionProviderKeys.Logger,
        useValue: options.logger,
      },
      ExceptionHandlerService,
      ExceptionRegistryService,
      { provide: APP_FILTER, useClass: AppExceptionFilter },
    ];
  }

  onModuleInit() {
    AppException.init(this.errorRegistry, false);
  }
}
