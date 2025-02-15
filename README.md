# @webxsid/nest-exception

A centralized exception handling module for NestJS applications. It provides structured error management, logging, and automatic exception handling.

## Features

- **Centralized Error Registry**: Define and manage application errors easily.
- **Automatic Error Handling**: Custom `AppException` class integrates seamlessly.
- **Flexible Error Registration**: Predefine errors in the module or register dynamically.
- **Extendable Error Handling**: Customize error handling with `ExceptionFilter`.
- **Stack Trace (Development Mode)**: Automatically captures stack trace for debugging.
- **Seamless Integration**: Just import the module and start using it.

## Installation

Install the package using npm or yarn:

```bash
$ npm install @webxsid/nest-exception
# or
$ yarn add @webxsid/nest-exception
```

## Usage

### Importing and Setting Up the Module

- Import the `AppExceptionModule` in the root module using `forRoot` or `forRootAsync`:

```typescript
import { Module } from '@nestjs/common';
import { AppExceptionModule } from '@webxsid/nest-exception';

@Module({
    imports: [AppExceptionModule.forRoot({
        isDev: process.env.NODE_ENV === 'development',
        errors: [
            { code: 'E001', message: 'User not found' },
            { code: 'E002', message: 'Invalid credentials' },
        ],
        logger: LoggerService // Any implementation of LoggerService
    })],
})
export class AppModule {}
```

#### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { AppExceptionModule } from '@webxsid/nest-exception';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        AppExceptionModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                isDev: configService.get('NODE_ENV') === 'development',
                errors: [
                    { code: 'E001', message: 'User not found' },
                    { code: 'E002', message: 'Invalid credentials' },
                ],
                logger: LoggerService // Any implementation of LoggerService
            }),
            inject: [ConfigService]
        })
    ],
})
export class AppModule {}
```

### Registering the Global Exception Filter

- Add the `AppExceptionFilter` globally in your main bootstrap file:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppExceptionFilter } from '@webxsid/nest-exception';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new AppExceptionFilter());
    await app.listen(3000);
}

bootstrap();
```

## Error Management

### Registering Errors in the Module

Errors can be pre-registered in the module configuration:

```typescript
imports: [
    AppExceptionModule.forRoot({
        errors: [
            { code: 'E001', message: 'User not found' },
            { code: 'E002', message: 'Invalid credentials' },
        ]
    })
]
```

### Registering Errors Dynamically

- Use the `ExceptionRegistry` service to register errors at runtime:

```typescript
import { Injectable } from '@nestjs/common';
import { ExceptionRegistry } from '@webxsid/nest-exception';

@Injectable()
export class AppService {
    constructor(private readonly exceptionRegistry: ExceptionRegistry) {}

    registerErrors() {
        this.exceptionRegistry.registerError({ code: 'E003', message: 'Invalid request' });
    }
}
```

### Extending the Exception Handler

- Use the `ExceptionHandlerService` to customize error handling for specific exceptions:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ExceptionHandlerService } from '@webxsid/nest-exception';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';

@Injectable()
export class MongoErrorHandler implements OnModuleInit {
    constructor(private readonly exceptionHandlerService: ExceptionHandlerService) {}

    onModuleInit() {
        this.exceptionHandlerService.register(MongoError, (exception: MongoError, host: ArgumentsHost) => {
            const response = host.switchToHttp().getResponse();
            response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 'MONGO_ERROR',
                message: exception.message,
                timestamp: new Date().toISOString(),
            });
        });
    }
}
```

- Add the handler class to the module providers:

```typescript
@Module({
    imports: [AppExceptionModule.forRoot(/*...*/)],
    providers: [MongoErrorHandler]
})
export class AppModule {}
```

### Throwing Custom Exceptions

- Use the `AppException` class to throw predefined errors:

```typescript
import { Injectable } from '@nestjs/common';
import { AppException } from '@webxsid/nest-exception';

@Injectable()
export class AppService {
    async getUser(id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new AppException('E001');
        }
        return user;
    }
}
```

## How It Works

The AppException class simplifies error handling by checking if the provided error code exists in the Exception Registry. Here’s how it behaves in different scenarios:

### 1. ✅ Passing a Registered Error Code

If the error code exists in the registry (either pre-registered in the module or added dynamically), AppException will:
•	Retrieve the corresponding error message and status code.
•	Construct a structured HTTP response with the correct status, message, and code.

```typescript
throw new AppException('E001'); 
```

**Output:**
```json
{
    "statusCode": 400,
    "errorCode": "E001",
    "message": "User not found",
    "timestamp": "2021-09-01T12:00:00.000Z"
}
```
_(Assuming the error code 'E001' is registered with the message 'User not found' and status code 400)_

### 2. ❌ Passing an Unregistered Error Code or String

If the error code is not found in the registry, AppException will:
•	Throw an internal server error with the default message and status code.
•	Log the error using the provided logger service.

```typescript
throw new AppException('Something went wrong'); 
```

**Output:**
```json
{
    "statusCode": 500,
    "errorCode": "UNKNOWN_ERROR",
    "message": "Internal server error",
    "timestamp": "2021-09-01T12:00:00.000Z"
}
```

#### 🛠️ Development Mode (Stack Trace)

If **development mode** (isDev: true) is enabled, AppException will also include a stack trace for easier debugging:

```json
{
    "statusCode": 500,
    "errorCode": "UNKNOWN_ERROR",
    "message": "Internal server error",
    "timestamp": "2021-09-01T12:00:00.000Z",
    "stack": "Error: Internal server error\n    at AppService.getUser (/app/app.service.ts:12:13)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
}
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [ESLint](https://eslint.org/)

## Author

[Siddharth Mittal](https://webxsid.com/)