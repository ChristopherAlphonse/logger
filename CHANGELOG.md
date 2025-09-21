# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-21

### Added

- **Enhanced Table Safety**: Robust serialization for `logger.table()` method
  - Safe handling of BigInt values (converted to string with 'n' suffix)
  - Circular reference detection and protection 
  - Special object type handling (Date, Error, Map, Set, etc.)
  - Graceful fallback for serialization errors
  - Prevents crashes when logging complex data structures

### Fixed

- **Code Quality**: Resolved all Biome linting issues for enterprise-grade code
  - Fixed constructor variable shadowing by renaming to `constructorName`
  - Reduced cognitive complexity by refactoring into smaller, focused functions
  - Replaced banned `Function` type with proper function signatures
  - Improved code readability with dot notation over bracket notation

- **CI/CD Improvements**: Enhanced auto-release workflow reliability
  - Added `[skip ci]` protection to prevent infinite loops
  - Improved git synchronization and conflict resolution
  - Enhanced workflow concurrency controls
  - Better error handling and rollback procedures

### Technical Improvements

- **Modular Safety Functions**: Created focused helper methods for better maintainability
  - `convertObjectToString()` - handles object conversion with circular protection
  - `getObjectTypeString()` - identifies and formats specific object types  
  - `valueToString()` - simplified main conversion coordinator
  - `safeStringifyObject()` - comprehensive object serialization with fallbacks

- **Type Safety**: Enhanced TypeScript support
  - Proper function type annotations replacing generic `Function` type
  - Better type inference for complex object structures
  - Improved error handling with specific type guards

### Developer Experience

- **Build Pipeline**: All checks pass without warnings
  - ✅ Biome linting (0 errors, 0 warnings)
  - ✅ TypeScript compilation 
  - ✅ 119 test cases passing
  - ✅ Vite production build

## [1.1.0] - 2025-01-27

### Added

- **Table Logging**: New `logger.table()` method for displaying tabular data

  - Supports custom headers and border options
  - Colored headers with proper column alignment
  - Works with both text and JSON output formats
  - Example: `logger.table(data, { headers: ['Name', 'Age'], border: false })`

- **Modular Architecture**: Split logger into focused, maintainable modules
  - `LogFormatter` class in `src/formatters.ts` for all formatting logic
  - `LoggerFactory` class in `src/factories.ts` for specialized logger creation
  - Exported `LogFormatter` and `LoggerFactory` for advanced use cases

### Changed

- **Code Organization**: Refactored main logger file from 753 to ~320 lines (50%+ reduction)

  - Improved separation of concerns with dedicated formatter and factory modules
  - Enhanced maintainability and testability
  - Better code structure following enterprise standards

- **Backward Compatibility**: Maintained all existing APIs while improving internal architecture
  - Static factory methods on Logger class now delegate to LoggerFactory (with deprecation warnings)
  - All existing imports and usage patterns continue to work unchanged
  - Added new export paths for advanced users: `import { LoggerFactory, LogFormatter }`

### Technical Improvements

- **Enhanced Modularity**: Clear separation between logging, formatting, and factory concerns
- **Improved Testability**: Individual components can now be tested in isolation
- **Better Maintainability**: Smaller, focused files are easier to understand and modify
- **Future Extensibility**: Easy to add new formatters or factory methods without modifying core logger

### Examples

```typescript
// New table logging functionality
const data = [
  { name: 'Alice', age: 25, role: 'Engineer' },
  { name: 'Bob', age: 30, role: 'Designer' },
];

logger.table(data);
logger.table(LogLevel.DEBUG, data, { headers: ['Person', 'Years', 'Job'] });

// Using new modular exports
import { LoggerFactory, LogFormatter } from '@calphonse/logger';
const jsonLogger = LoggerFactory.createJsonLogger({ level: LogLevel.WARN });
const formatter = new LogFormatter();
```

## [1.0.3] - 2025-07-21

### Fixed

- **Dual Module Support**: Fixed CommonJS and ESM compatibility issues
  - Resolved chalk import handling for both module systems
  - Fixed method binding issues in exported logger instance
  - Ensured proper `this` context preservation for logger methods

### Added

- **Multiple Import Patterns**: Support for various CommonJS import styles
  - `const { logger } = require('@calphonse/logger')` (recommended)
  - `const { logger, createLogger, LogLevel } = require('@calphonse/logger')`
- **Enhanced Developer Experience**: Better TypeScript support and error handling

## [1.0.2] - 2025-07-21

### Fixed

- Minor documentation and build improvements

## [1.0.1] - 2025-07-20

### Fixed

- Resolved npm publication issues with initial release

## [1.0.0] - 2025-07-20

### Added

- **Initial Release** - A beautiful, feature-rich logging library for Node.js applications
- **Core Logging Features**:

  - Multiple log levels: ERROR, WARN, INFO, DEBUG, TRACE
  - Colored terminal output using chalk
  - Timestamp support with customizable format
  - Source file information tracking
  - Structured data logging with JSON support
  - Custom prefixes for log organization

- **Logger Configuration**:

  - Flexible configuration system with sensible defaults
  - Environment-aware settings
  - Custom output streams support
  - Color and formatting controls
  - Log level filtering

- **Developer Experience**:

  - TypeScript-first design with full type safety
  - Comprehensive TSDoc documentation
  - IntelliSense support with parameter hints
  - Zero-configuration setup
  - Familiar API similar to console.log

- **Advanced Features**:

  - Child loggers with prefix inheritance
  - JSON output format for production environments
  - Circular reference protection
  - Error boundary handling
  - Performance-optimized conditional logging

- **Factory Methods**:

  - `Logger.createJsonLogger()` - Production-ready JSON logging
  - `Logger.createMinimalLogger()` - Simple console output
  - `Logger.createVerboseLogger()` - Development debugging

- **Convenience Functions**:

  - Global `log` object for quick logging
  - `createLogger()` factory function
  - `createChildLogger()` for module-specific logging
  - `setLogLevel()` for dynamic level control
  - `configureLogger()` for runtime configuration

- **Production Ready**:
  - Small bundle size (18.07 kB, 4.66 kB gzipped)
  - Minimal dependencies (only chalk as runtime dependency)
  - Comprehensive test suite (70 tests, 100% pass rate)
  - ESM and CommonJS support
  - Source maps for debugging

### Technical Details

- **Bundle Size**: 18.07 kB (4.66 kB gzipped)
- **Dependencies**: chalk ^5.3.0
- **Node.js**: >=20.0.0
- **TypeScript**: Full type safety with strict mode
- **Testing**: Jest with 70 comprehensive tests
- **Linting**: Biome for code quality
- **Build**: Vite with TypeScript declarations

### Documentation

- Comprehensive README with usage examples
- API reference with TSDoc comments
- TypeScript declaration files
- Working examples in `/examples` directory
- Development setup instructions

### Examples

```typescript
// Basic usage
import { logger } from '@calphonse/logger';
logger.info('Application started');

// Custom configuration
import { createLogger, LogLevel } from '@calphonse/logger';
const logger = createLogger({
  level: LogLevel.DEBUG,
  prefix: 'API',
  colors: true,
});

// Child loggers
const dbLogger = logger.child('Database');
dbLogger.info('Connection established');

// JSON output for production
const prodLogger = Logger.createJsonLogger({ level: LogLevel.WARN });
prodLogger.warn('High memory usage', { usage: '85%' });
```

### Breaking Changes

- None (initial release)

### Migration Guide

- N/A (initial release)

---

## [Unreleased]

### Planned Features

- Context management with correlation IDs
- Enhanced error handling with user-friendly messages
- Log filtering and search capabilities
- Transport system for file and HTTP logging
- Performance monitoring and metrics
- Framework integrations (Express, Fastify, NestJS)
- Environment-specific configurations
- Log rotation and archival
- Structured logging improvements
- Performance optimizations

### Roadmap

See [PRD](tasks/prd-logger-enhancement.md) for detailed 6-month development plan.
