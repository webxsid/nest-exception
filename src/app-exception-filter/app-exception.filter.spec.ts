import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppExceptionFilter } from './app-exception.filter';
import { AppException } from '../app-exception';
import {
  AppExceptionModule,
  AppExceptionModuleOptions,
} from '../app-exception.module';
import { ExceptionRegistryService } from '../exception-registry';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppExceptionProviderKeys } from '../constant';

describe('GlobalAppExceptionFilter', () => {
  describe('forRoot', () => {
    let filter: AppExceptionFilter;
    let errorRegistry: ExceptionRegistryService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          AppExceptionModule.forRoot({
            isDev: true,
            errors: [
              {
                code: 'TEST_ERROR',
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Test error message',
              },
            ] as AppExceptionModuleOptions['errors'],
          }),
        ],
        providers: [AppExceptionFilter],
      }).compile();

      errorRegistry = module.get<ExceptionRegistryService>(
        ExceptionRegistryService,
      );
      const isDev = module.get<boolean>(AppExceptionProviderKeys.IsDevMode);

      // Manually initialize AppException for tests
      AppException.init(errorRegistry, isDev);

      filter = module.get<AppExceptionFilter>(AppExceptionFilter);
    });

    it('should handle AppException correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockRequest = { url: '/test' };
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      const exception = new AppException('UNDEFINED_ERROR', 'stack-trace');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: 'UNKNOWN_ERROR',
          message: 'UNDEFINED_ERROR',
          path: '/test',
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ) as unknown as string,
        }),
      );
    });

    it('should handle generic HttpException correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = { url: '/test' };
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
          path: '/test',
        }),
      );
    });

    it('should handle pre defined errors correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = { url: '/test' };
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      const exception = new AppException('TEST_ERROR', 'stack-trace');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'TEST_ERROR',
          message: 'Test error message',
          path: '/test',
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ) as unknown as string,
        }),
      );
    });

    it('should handled dynamically defined errors correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = { url: '/test-dynamic' };
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      errorRegistry.registerError(
        'DYNAMIC_ERROR',
        HttpStatus.CONFLICT,
        'Dynamic error message',
      );

      const exception = new AppException('DYNAMIC_ERROR', 'stack-trace');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'DYNAMIC_ERROR',
          message: 'Dynamic error message',
          path: '/test-dynamic',
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ) as unknown as string,
        }),
      );
    });
  });

  describe('forRootAsync', () => {
    let filter: AppExceptionFilter;
    let errorRegistry: ExceptionRegistryService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          await ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                IS_DEV: true,
                ERRORS: [
                  {
                    code: 'ASYNC_ERROR',
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'Async error message',
                  },
                ],
              }),
            ],
          }),
          AppExceptionModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              isDev: configService.get<boolean>('IS_DEV'),
              errors: configService.get<AppExceptionModuleOptions['errors']>(
                AppExceptionProviderKeys.Errors,
              ),
            }),
          }),
        ],
        providers: [AppExceptionFilter],
      }).compile();

      errorRegistry = module.get<ExceptionRegistryService>(
        ExceptionRegistryService,
      );
      const isDev = module.get<boolean>(AppExceptionProviderKeys.IsDevMode);

      // Manually initialize AppException for tests
      AppException.init(errorRegistry, isDev);

      filter = module.get<AppExceptionFilter>(AppExceptionFilter);
    });

    it('should handle AppException correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockRequest = { url: '/test' };
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      const exception = new AppException('UNDEFINED_ERROR', 'stack-trace');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: 'UNKNOWN_ERROR',
          message: 'UNDEFINED_ERROR',
        }),
      );
    });
  });
});
