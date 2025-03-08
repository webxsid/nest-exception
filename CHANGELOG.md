# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2025-03-08
### Fixed
- Updated documentation to correctly register `AppExceptionFilter` using `APP_FILTER` in `AppModule`, ensuring proper dependency injection.

## [1.0.1] - 2025-03-08

### Fixed

- Resolved dependency injection issue when using forRootAsync() without ConfigModule.forRoot({ isGlobal: true }).
- Ensured ConfigModule is properly imported and propagated within AppExceptionModule.

## [1.0.0]

### Added

- Initial release of @webxsid/nest-exception.
- Support for structured error handling in NestJS applications.
- AppExceptionModule with forRoot() and forRootAsync() methods.
- ExceptionRegistryService for managing and retrieving error definitions. 
- AppExceptionFilter for catching and formatting exceptions consistently. 
- Optional logger integration for enhanced debugging.

