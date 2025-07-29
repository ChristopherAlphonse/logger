# Design Patterns in Logger

This document describes the design patterns implemented in the logger system to ensure scalability, maintainability, and type safety.

## Overview

The logger system implements several design patterns to provide a flexible, extensible, and maintainable logging solution:

1. **Abstract Factory Pattern** - For creating different types of loggers
2. **Builder Pattern** - For flexible logger configuration
3. **Bridge Pattern** - To separate logger abstraction from implementation
4. **Strategy Pattern** - For different formatting strategies
5. **Registry Pattern** - For centralized logger management

## 1. Abstract Factory Pattern

The Abstract Factory pattern is used to create families of related logger objects without specifying their concrete classes.

### Abstract Factory Interface

```typescript
interface ILoggerFactory {
  createLogger(config?: Partial<LoggerConfig>): ILogger;
  createJsonLogger(config?: Partial<LoggerConfig>): ILogger;
  createMinimalLogger(config?: Partial<LoggerConfig>): ILogger;
  createVerboseLogger(config?: Partial<LoggerConfig>): ILogger;
}
```

### Concrete Factories

#### StandardLoggerFactory

Creates standard logger instances with common configurations.

```typescript
import { StandardLoggerFactory } from '@calphonse/logger';

const factory = new StandardLoggerFactory();
const logger = factory.createLogger({ prefix: 'App' });
```

#### BuilderLoggerFactory

Creates loggers using the Builder pattern for more complex configurations.

```typescript
import { BuilderLoggerFactory } from '@calphonse/logger';

const factory = new BuilderLoggerFactory();
const logger = factory.createJsonLogger();
```

#### EnvironmentLoggerFactory

Creates environment-specific loggers (development, production, test, CI).

```typescript
import { EnvironmentLoggerFactory } from '@calphonse/logger';

// Development logger with colors and debug level
const devFactory = new EnvironmentLoggerFactory('development');
const devLogger = devFactory.createLogger();

// Production logger with JSON output and warn level
const prodFactory = new EnvironmentLoggerFactory('production');
const prodLogger = prodFactory.createLogger();
```

### Factory Registry

The `LoggerFactoryRegistry` manages different factory types:

```typescript
import { loggerFactoryRegistry } from '@calphonse/logger';

// Get specific factory types
const standardFactory = loggerFactoryRegistry.getStandard();
const builderFactory = loggerFactoryRegistry.getBuilder();
const envFactory = loggerFactoryRegistry.getEnvironment('production');

// Register custom factory
const customFactory = new CustomLoggerFactory();
loggerFactoryRegistry.register('custom', customFactory);
```

## 2. Builder Pattern

The Builder pattern provides a fluent interface for constructing complex logger configurations.

### Builder Interface

```typescript
interface ILoggerBuilder {
  setLevel(level: LogLevel | LogLevelString): ILoggerBuilder;
  setTimestamps(enabled: boolean): ILoggerBuilder;
  setColors(enabled: boolean): ILoggerBuilder;
  setTimestampFormat(format: string): ILoggerBuilder;
  setShowSource(enabled: boolean): ILoggerBuilder;
  setPrefix(prefix: string): ILoggerBuilder;
  setJson(enabled: boolean): ILoggerBuilder;
  setOutput(output: NodeJS.WritableStream): ILoggerBuilder;
  setHandler(handler: LogHandler | null): ILoggerBuilder;
  build(): ILogger;
  reset(): ILoggerBuilder;
  buildJsonLogger(): ILogger;
  buildMinimalLogger(): ILogger;
  buildVerboseLogger(): ILogger;
  buildDevelopmentLogger(): ILogger;
  buildProductionLogger(): ILogger;
}
```

### Usage Examples

#### Basic Builder Usage

```typescript
import { LoggerBuilder } from '@calphonse/logger';

const logger = new LoggerBuilder()
  .setLevel('debug')
  .setPrefix('API')
  .setColors(true)
  .setTimestamps(true)
  .setShowSource(true)
  .build();
```

#### Predefined Configurations

```typescript
import { LoggerBuilder } from '@calphonse/logger';

const builder = new LoggerBuilder();

// Production logger
const prodLogger = builder.buildProductionLogger();

// Development logger
const devLogger = builder.buildDevelopmentLogger();

// JSON logger for log aggregation
const jsonLogger = builder.buildJsonLogger();

// Minimal logger for simple output
const minimalLogger = builder.buildMinimalLogger();

// Verbose logger for debugging
const verboseLogger = builder.buildVerboseLogger();
```

### Director Pattern

The `LoggerDirector` provides high-level construction methods:

```typescript
import { LoggerDirector, LoggerBuilder } from '@calphonse/logger';

const director = new LoggerDirector(new LoggerBuilder());

const devLogger = director.buildDevelopmentLogger();
const prodLogger = director.buildProductionLogger();
const testLogger = director.buildTestLogger();
const ciLogger = director.buildCILogger();
```

## 3. Bridge Pattern

The Bridge pattern separates the logger abstraction from its implementation, allowing both to vary independently.

### Abstraction

The `Logger` class serves as the abstraction:

```typescript
class Logger implements ILogger {
  constructor(
    config: LoggerConfig = {},
    formatter?: ILogFormatter,
    implementation?: ILogImplementation
  ) {
    // Implementation details
  }
}
```

### Implementation Interface

```typescript
interface ILogImplementation {
  write(output: string): void;
  getSourceInfo(): string;
}
```

### Concrete Implementations

#### ConsoleLogImplementation

Writes logs to console streams (stdout/stderr).

```typescript
import { ConsoleLogImplementation } from '@calphonse/logger';

const implementation = new ConsoleLogImplementation(process.stdout);
const logger = new Logger({}, undefined, implementation);
```

#### FileLogImplementation

Writes logs to file streams.

```typescript
import { FileLogImplementation } from '@calphonse/logger';
import { createWriteStream } from 'fs';

const fileStream = createWriteStream('app.log');
const implementation = new FileLogImplementation(fileStream);
const logger = new Logger({}, undefined, implementation);
```

#### MemoryLogImplementation

Stores logs in memory for testing and buffering.

```typescript
import { MemoryLogImplementation } from '@calphonse/logger';

const implementation = new MemoryLogImplementation();
const logger = new Logger({}, undefined, implementation);

logger.info('Test message');
const logs = implementation.getLogs(); // ['[INFO] Test message\n']
```

#### NullLogImplementation

Silent implementation for disabling logging.

```typescript
import { NullLogImplementation } from '@calphonse/logger';

const implementation = new NullLogImplementation();
const logger = new Logger({}, undefined, implementation);

// No output is produced
logger.info('This will not be logged');
```

## 4. Strategy Pattern

The Strategy pattern allows different formatting strategies to be used interchangeably.

### Formatter Interface

```typescript
interface ILogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string;
  formatJson(entry: LogEntry): string;
  formatText(entry: LogEntry, config: LoggerConfig): string;
  formatTable(
    entry: LogEntry,
    data: Record<string, unknown>[],
    config: LoggerConfig,
    options: { headers?: string[]; border?: boolean }
  ): string[];
}
```

### Concrete Formatters

#### ColoredTextFormatter

Formats logs with ANSI color codes for terminal output.

```typescript
import { ColoredTextFormatter } from '@calphonse/logger';

const formatter = new ColoredTextFormatter();
const logger = new Logger({}, formatter);
```

#### PlainTextFormatter

Formats logs without colors for simple text output.

```typescript
import { PlainTextFormatter } from '@calphonse/logger';

const formatter = new PlainTextFormatter();
const logger = new Logger({}, formatter);
```

#### JsonFormatter

Always formats logs as JSON for machine-readable output.

```typescript
import { JsonFormatter } from '@calphonse/logger';

const formatter = new JsonFormatter();
const logger = new Logger({}, formatter);
```

### Usage Examples

```typescript
import { Logger, ColoredTextFormatter, JsonFormatter } from '@calphonse/logger';

// Colored output for development
const devLogger = new Logger({}, new ColoredTextFormatter());

// JSON output for production
const prodLogger = new Logger({}, new JsonFormatter());

// Switch formatters dynamically
const logger = new Logger({}, new ColoredTextFormatter());
// ... later ...
logger.setFormatter(new JsonFormatter());
```

## 5. Registry Pattern

The Registry pattern provides centralized management of logger instances.

### Global Registry Functions

```typescript
import {
  setGlobalLogLevel,
  setGlobalLogHandler,
  getLogger,
  getAllLoggers,
  getGlobalLogLevel,
  getGlobalLogHandler,
  getLoggerById,
  getLoggerNames,
  clearLoggerRegistry,
  getLoggerCount,
} from '@calphonse/logger';
```

### Usage Examples

#### Global Control

```typescript
// Set global log level for all registered loggers
setGlobalLogLevel('warn');

// Set global handler for all loggers
const globalHandler = params => {
  // Send to external logging service
  externalService.log(params);
};
setGlobalLogHandler(globalHandler);
```

#### Logger Management

```typescript
// Get logger by name
const apiLogger = getLogger('API');

// Get all registered loggers
const allLoggers = getAllLoggers();

// Get logger names
const loggerNames = getLoggerNames();

// Get logger count
const count = getLoggerCount();

// Clear all loggers
clearLoggerRegistry();
```

#### Custom Handlers

```typescript
const customHandler = (params: LogCallbackParams) => {
  // Custom logging logic
  console.log(`[${params.level.toUpperCase()}] ${params.message}`);

  // Send to monitoring service
  if (params.level === 'error') {
    monitoringService.alert(params);
  }
};

const logger = new Logger({ prefix: 'App' });
logger.setHandler(customHandler);
```

## Integration Examples

### Complete Application Setup

```typescript
import {
  EnvironmentLoggerFactory,
  LoggerBuilder,
  setGlobalLogLevel,
  setGlobalHandler,
} from '@calphonse/logger';

// Environment-based setup
const factory = new EnvironmentLoggerFactory(
  process.env.NODE_ENV || 'development'
);
const mainLogger = factory.createLogger({ prefix: 'App' });

// Module-specific loggers
const dbLogger = mainLogger.child('Database');
const apiLogger = mainLogger.child('API');
const authLogger = mainLogger.child('Auth');

// Global configuration
setGlobalLogLevel(process.env.LOG_LEVEL || 'info');

// Custom global handler for production
if (process.env.NODE_ENV === 'production') {
  setGlobalHandler(params => {
    // Send to log aggregation service
    logService.send(params);
  });
}
```

### Testing Setup

```typescript
import { MemoryLogImplementation, LoggerBuilder } from '@calphonse/logger';

// Test logger with memory implementation
const testImplementation = new MemoryLogImplementation();
const testLogger = new LoggerBuilder()
  .setLevel('trace')
  .setTimestamps(false)
  .setColors(false)
  .build();

// Verify logs in tests
testLogger.info('Test message');
const logs = testImplementation.getLogs();
expect(logs.some(log => log.includes('Test message'))).toBe(true);
```

### Production Setup

```typescript
import { LoggerBuilder, JsonFormatter } from '@calphonse/logger';
import { createWriteStream } from 'fs';

// Production logger with file output
const fileStream = createWriteStream('app.log', { flags: 'a' });
const prodLogger = new LoggerBuilder()
  .setLevel('warn')
  .setJson(true)
  .setColors(false)
  .setOutput(fileStream)
  .build();
```

## Benefits of Design Patterns

1. **Scalability**: Easy to add new logger types, formatters, and implementations
2. **Maintainability**: Clear separation of concerns and responsibilities
3. **Type Safety**: Full TypeScript support with no `any` types
4. **Testability**: Easy to mock and test individual components
5. **Flexibility**: Multiple ways to configure and use loggers
6. **Extensibility**: Simple to add new features without breaking existing code

## Best Practices

1. **Use appropriate factory for your use case**

   - `StandardLoggerFactory` for simple cases
   - `BuilderLoggerFactory` for complex configurations
   - `EnvironmentLoggerFactory` for environment-specific setups

2. **Choose the right formatter**

   - `ColoredTextFormatter` for development
   - `JsonFormatter` for production and log aggregation
   - `PlainTextFormatter` for simple output

3. **Select appropriate implementation**

   - `ConsoleLogImplementation` for standard output
   - `FileLogImplementation` for file logging
   - `MemoryLogImplementation` for testing
   - `NullLogImplementation` for silent logging

4. **Use the registry for global control**

   - Set global log levels for all loggers
   - Use global handlers for centralized logging
   - Manage logger lifecycle properly

5. **Leverage the builder for complex configurations**
   - Use fluent interface for readable configuration
   - Use predefined configurations for common scenarios
   - Reset builder when reusing

This design pattern implementation ensures that the logger system is robust, maintainable, and ready for production use while providing the flexibility needed for different use cases and environments.
