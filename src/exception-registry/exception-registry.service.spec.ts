import { Test, TestingModule } from '@nestjs/testing';
import { ExceptionRegistryService } from './exception-registry.service';
import { HttpStatus } from '@nestjs/common';

describe('ErrorRegistryService', () => {
  let service: ExceptionRegistryService;

  beforeEach(async () => {
    const mockErrors = []; // Provide an empty or predefined error array

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'AppExceptionErrors', // Ensure this matches the injection token in your service
          useValue: mockErrors,
        },
        ExceptionRegistryService,
      ],
    }).compile();

    service = module.get<ExceptionRegistryService>(ExceptionRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register an error and retrieve it', () => {
    const code = 'TEST_ERROR';
    const statusCode = HttpStatus.BAD_REQUEST;
    const message = 'This is a test error';

    const id = service.registerError(code, statusCode, message);
    expect(id).toBeDefined();

    const retrievedError = service.getError(code);
    expect(retrievedError).toBeDefined();
    expect(retrievedError?.code).toBe(code);
    expect(retrievedError?.statusCode).toBe(statusCode);
    expect(retrievedError?.message).toBe(message);
  });

  it('should return undefined for an unregistered error code', () => {
    expect(service.getError('NON_EXISTENT_ERROR')).toBeUndefined();
  });

  it('should initialize with predefined errors', async () => {
    const predefinedErrors = [
      {
        code: 'PRESET_ERROR',
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Preset error message',
      },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'AppExceptionErrors',
          useValue: predefinedErrors,
        },
        ExceptionRegistryService,
      ],
    }).compile();

    const serviceWithPredefined = module.get<ExceptionRegistryService>(
      ExceptionRegistryService,
    );
    const presetError = serviceWithPredefined.getError('PRESET_ERROR');
    expect(presetError).toBeDefined();
    expect(presetError?.message).toBe('Preset error message');
  });
});
