// src/app-exception/app-exception.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception';
import { ExceptionRegistryService } from '../exception-registry';

describe('AppException', () => {
  let errorRegistryService: ExceptionRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ExceptionRegistryService,
          useValue: {
            getError: jest.fn(),
          },
        },
      ],
    }).compile();

    errorRegistryService = module.get<ExceptionRegistryService>(
      ExceptionRegistryService,
    );

    AppException.init(errorRegistryService, true);
  });

  it('should create an AppException with a registered error', () => {
    jest.spyOn(errorRegistryService, 'getError').mockReturnValue({
      code: 'TEST_ERROR',
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Test error message',
      id: 'ERR-1',
    });

    const exception = new AppException('TEST_ERROR');

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('Test error message');
    expect(exception.code).toBe('TEST_ERROR');
    expect(exception.trace).toBeDefined();
  });

  it('should create an AppException with a custom error message if not found in registry', () => {
    jest.spyOn(errorRegistryService, 'getError').mockReturnValue(undefined);

    const exception = new AppException('Custom error message');

    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.message).toBe('Custom error message');
    expect(exception.code).toBe('UNKNOWN_ERROR');
    expect(exception.trace).toBeDefined();
  });

  it('should include trace if IS_DEV is true', () => {
    jest.spyOn(errorRegistryService, 'getError').mockReturnValue(undefined);

    const exception = new AppException('Custom error message');

    expect(exception.trace).toBeDefined();
  });

  it('should not include trace if IS_DEV is false', () => {
    jest.spyOn(errorRegistryService, 'getError').mockReturnValue(undefined);

    const exception = new AppException('Custom error message');

    expect(exception.trace).toBeDefined();
  });
});
