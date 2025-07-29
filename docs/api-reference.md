# API Reference

Complete API reference for the enhanced logger library.

## Default Export

### `logger`

The default logger instance with all methods available.

```typescript
import logger from '@calphonse/logger';

// Basic logging methods
logger.error(message: string, data?: LogData): void
logger.warn(message: string, data?: LogData): void
logger.info(message: string, data?: LogData): void
logger.debug(message: string, data?: LogData): void
logger.trace(message: string, data?: LogData): void

// Table logging
logger.table(data: LogData | LogData[], options?: TableOptions): void

// Configuration methods
logger.setLevel(level: LogLevel | LogLevelString): void
logger.setConfig(config: Partial<LoggerConfig>): void
logger.getConfig(): LoggerConfig
logger.isEnabled(level: LogLevel): boolean

// Child logger creation
logger.child(prefix: string): Logger

// Custom handlers
logger.setHandler(handler: LogHandler | null): void
logger.getHandler(): LogHandler | null

// Factory methods
logger.createLogger(config?: LoggerConfig): Logger
logger.createJsonLogger(config?: LoggerConfig): Logger
logger.createMinimalLogger(config?: LoggerConfig): Logger
logger.createVerboseLogger(config?: LoggerConfig): Logger
```

## Named Exports

### Classes

#### `Logger`

The main logger class.

```typescript
import { Logger } from '@calphonse/logger';

class Logger implements ILogger {
  constructor(config?: LoggerConfig);

  // Logging methods
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
  trace(message: string, data?: LogData): void;

  // Table logging
  table(data: LogData | LogData[], options?: TableOptions): void;

  // Configuration
  setLevel(level: LogLevel | LogLevelString): void;
  setConfig(config: Partial<LoggerConfig>): void;
  getConfig(): LoggerConfig;
  isEnabled(level: LogLevel): boolean;

  // Child logger
  child(prefix: string): Logger;

  // Custom handlers
  setHandler(handler: LogHandler | null): void;
  getHandler(): LogHandler | null;
}
```

#### `LoggerFactory`

Factory class for creating loggers with predefined configurations.

```typescript
import { LoggerFactory } from '@calphonse/logger';

class LoggerFactory {
  static createLogger(config?: LoggerConfig): Logger;
  static createJsonLogger(config?: LoggerConfig): Logger;
  static createMinimalLogger(config?: LoggerConfig): Logger;
  static createVerboseLogger(config?: LoggerConfig): Logger;
}
```

#### `LogFormatter`

Handles log message formatting.

```typescript
import { LogFormatter } from '@calphonse/logger';

class LogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string;
  formatTable(data: LogData | LogData[], options?: TableOptions): string;
}
```

### Enums

#### `LogLevel`

```typescript
import { LogLevel } from '@calphonse/logger';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}
```

### Types

#### `LogLevelString`

```typescript
import { LogLevelString } from '@calphonse/logger';

type LogLevelString = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
```

#### `LogData`

```typescript
import { LogData } from '@calphonse/logger';

type LogData = Record<string, any>;
```

#### `LoggerConfig`

```typescript
import { LoggerConfig } from '@calphonse/logger';

interface LoggerConfig {
  level?: LogLevel | LogLevelString;
  prefix?: string;
  colors?: boolean;
  timestamps?: boolean;
  timestampFormat?: string;
  showSource?: boolean;
  json?: boolean;
  output?: NodeJS.WritableStream;
}
```

#### `LogEntry`

```typescript
import { LogEntry } from '@calphonse/logger';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: LogData;
  timestamp: Date;
  prefix?: string;
  source?: string;
}
```

#### `LogCallbackParams`

```typescript
import { LogCallbackParams } from '@calphonse/logger';

interface LogCallbackParams {
  level: LogLevelString;
  message: string;
  data?: LogData;
  timestamp: Date;
  source?: string;
  prefix?: string;
  loggerName?: string;
}
```

#### `LogHandler`

```typescript
import { LogHandler } from '@calphonse/logger';

type LogHandler = (params: LogCallbackParams) => void;
```

#### `ILogger`

```typescript
import { ILogger } from '@calphonse/logger';

interface ILogger {
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
  trace(message: string, data?: LogData): void;
  table(data: LogData | LogData[], options?: TableOptions): void;
  setLevel(level: LogLevel | LogLevelString): void;
  setConfig(config: Partial<LoggerConfig>): void;
  getConfig(): LoggerConfig;
  isEnabled(level: LogLevel): boolean;
  child(prefix: string): Logger;
  setHandler(handler: LogHandler | null): void;
  getHandler(): LogHandler | null;
}
```

#### `TableOptions`

```typescript
import { TableOptions } from '@calphonse/logger';

interface TableOptions {
  headers?: string[];
  border?: boolean;
}
```

### Utility Functions

#### `stringToLogLevel`

Convert string log level to enum.

```typescript
import { stringToLogLevel } from '@calphonse/logger';

function stringToLogLevel(level: LogLevelString): LogLevel;
```

#### `logLevelToString`

Convert enum log level to string.

```typescript
import { logLevelToString } from '@calphonse/logger';

function logLevelToString(level: LogLevel): LogLevelString;
```

### Global Registry Functions

#### `setGlobalLogLevel`

Set the global log level for all registered loggers.

```typescript
import { setGlobalLogLevel } from '@calphonse/logger';

function setGlobalLogLevel(level: LogLevelString | LogLevel): void;
```

#### `setGlobalLogHandler`

Set a global custom handler for all registered loggers.

```typescript
import { setGlobalLogHandler } from '@calphonse/logger';

function setGlobalLogHandler(handler: LogHandler | null): void;
```

#### `getAllLoggers`

Get all registered logger instances.

```typescript
import { getAllLoggers } from '@calphonse/logger';

function getAllLoggers(): ILogger[];
```

#### `getLogger`

Find a specific logger by prefix.

```typescript
import { getLogger } from '@calphonse/logger';

function getLogger(name: string): ILogger | undefined;
```

#### `getGlobalLogLevel`

Get the current global log level.

```typescript
import { getGlobalLogLevel } from '@calphonse/logger';

function getGlobalLogLevel(): LogLevel;
```

#### `getGlobalLogHandler`

Get the current global log handler.

```typescript
import { getGlobalLogHandler } from '@calphonse/logger';

function getGlobalLogHandler(): LogHandler | null;
```

### Convenience Functions

#### `log`

Direct logging function.

```typescript
import { log } from '@calphonse/logger';

function log(level: LogLevel, message: string, data?: LogData): void;
```

#### `createLogger`

Create a new logger instance.

```typescript
import { createLogger } from '@calphonse/logger';

function createLogger(config?: LoggerConfig): Logger;
```

#### `createChildLogger`

Create a child logger from an existing logger.

```typescript
import { createChildLogger } from '@calphonse/logger';

function createChildLogger(parent: Logger, prefix: string): Logger;
```

#### `setLogLevel`

Set log level for the default logger.

```typescript
import { setLogLevel } from '@calphonse/logger';

function setLogLevel(level: LogLevel | LogLevelString): void;
```

#### `configureLogger`

Configure the default logger.

```typescript
import { configureLogger } from '@calphonse/logger';

function configureLogger(config: Partial<LoggerConfig>): void;
```

## Configuration Options

### `LoggerConfig`

| Property          | Type                         | Default          | Description                     |
| ----------------- | ---------------------------- | ---------------- | ------------------------------- |
| `level`           | `LogLevel \| LogLevelString` | `LogLevel.INFO`  | Minimum log level to display    |
| `prefix`          | `string`                     | `undefined`      | Prefix for all log messages     |
| `colors`          | `boolean`                    | `true`           | Enable/disable colored output   |
| `timestamps`      | `boolean`                    | `false`          | Enable/disable timestamps       |
| `timestampFormat` | `string`                     | `'HH:mm:ss'`     | Timestamp format (when enabled) |
| `showSource`      | `boolean`                    | `false`          | Show source file information    |
| `json`            | `boolean`                    | `false`          | Output in JSON format           |
| `output`          | `NodeJS.WritableStream`      | `process.stdout` | Output stream                   |

### `TableOptions`

| Property  | Type       | Default     | Description                  |
| --------- | ---------- | ----------- | ---------------------------- |
| `headers` | `string[]` | `undefined` | Custom column headers        |
| `border`  | `boolean`  | `true`      | Enable/disable table borders |

## Log Levels

| Level    | Value | Description                                   |
| -------- | ----- | --------------------------------------------- |
| `ERROR`  | `0`   | Critical errors that need immediate attention |
| `WARN`   | `1`   | Warnings that should be investigated          |
| `INFO`   | `2`   | General information about application flow    |
| `DEBUG`  | `3`   | Detailed debugging information                |
| `TRACE`  | `4`   | Very detailed tracing information             |
| `SILENT` | `5`   | Suppress all log output                       |

## String Log Levels

| String     | Enum Equivalent      | Description         |
| ---------- | -------------------- | ------------------- |
| `'error'`  | `LogLevel.ERROR`     | Critical errors     |
| `'warn'`   | `LogLevel.WARN`      | Warnings            |
| `'info'`   | `LogLevel.INFO`      | General information |
| `'debug'`  | `LogLevel.DEBUG`     | Debug information   |
| `'trace'`  | `LogLevel.TRACE`     | Trace information   |
| `'silent'` | `LogLevel.ERROR + 1` | Suppress all logs   |

## Examples

### Basic Usage

```typescript
import logger from '@calphonse/logger';

logger.info('Application started');
logger.error('Database connection failed', { errorCode: 'DB001' });
```

### Custom Logger

```typescript
import { Logger } from '@calphonse/logger';

const customLogger = new Logger({
  prefix: 'MyApp',
  level: 'debug',
  timestamps: true,
});

customLogger.info('Custom logger message');
```

### Global Registry

```typescript
import { setGlobalLogLevel, setGlobalLogHandler } from '@calphonse/logger';

setGlobalLogLevel('warn');
setGlobalLogHandler(params => {
  console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
});
```

### Table Logging

```typescript
import logger from '@calphonse/logger';

const data = [
  { name: 'Alice', age: 28 },
  { name: 'Bob', age: 34 },
];

logger.table(data, { headers: ['Name', 'Age'] });
```

This API reference provides complete documentation for all available methods, types, and configuration options in the enhanced logger library.
