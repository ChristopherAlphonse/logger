# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  colors: true
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

