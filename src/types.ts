export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
  Log = 5,
}

/**
 * String-based log levels for easier configuration
 */
export type LogLevelString =
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent'
  | 'log';

/**
 * Convert string log level to enum
 */
export function stringToLogLevel(level: LogLevelString): LogLevel {
  const levelMap: Record<LogLevelString, LogLevel> = {
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    trace: LogLevel.TRACE,
    silent: LogLevel.ERROR + 1,
    log: LogLevel.Log,
  };
  return levelMap[level];
}

/**
 * Convert enum log level to string
 */
export function logLevelToString(level: LogLevel): LogLevelString {
  const stringMap: Record<LogLevel, LogLevelString> = {
    [LogLevel.ERROR]: 'error',
    [LogLevel.WARN]: 'warn',
    [LogLevel.INFO]: 'info',
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.TRACE]: 'trace',
    [LogLevel.Log]: 'log',
  };
  return stringMap[level] ?? 'info';
}

/**
 * Supported data types for logging
 */
export type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[]
  | Error
  | Date;

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Whether to enable timestamps */
  timestamps?: boolean;
  /** Whether to enable colored output */
  colors?: boolean;
  /** Custom timestamp format */
  timestampFormat?: string;
  /** Whether to enable source file information */
  showSource?: boolean;
  /** Custom prefix for all log messages */
  prefix?: string;
  /** Whether to enable JSON output format */
  json?: boolean;
  /** Custom output stream */
  output?: NodeJS.WritableStream;
  /** Custom log handler */
  handler?: LogHandler | null;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  data?: LogData;
  prefix?: string;
}

/**
 * Logger interface - Bridge Pattern Abstraction
 */
export interface ILogger {
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
  trace(message: string, data?: LogData): void;
  log(level: LogLevel, message: string, data?: LogData): void;
  table(
    dataOrLevel: LogLevel | Record<string, unknown>[] | Record<string, unknown>,
    dataOrOptions?:
      | Record<string, unknown>[]
      | { headers?: string[]; border?: boolean },
    options?: { headers?: string[]; border?: boolean }
  ): void;
  setLevel(level: LogLevel | LogLevelString): void;
  setConfig(config: Partial<LoggerConfig>): void;
  getConfig(): LoggerConfig;
  isEnabled(level: LogLevel): boolean;
  child(prefix: string): ILogger;
  setHandler(handler: LogHandler | null): void;
  getHandler(): LogHandler | null;
}

/**
 * Enhanced Logger interface with context support and console-like API
 */
export interface IEnhancedLogger {
  log(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  error(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  warn(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  info(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  debug(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  trace(
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void;
  table(
    dataOrLevel: LogLevel | Record<string, unknown>[] | Record<string, unknown>,
    dataOrOptions?:
      | Record<string, unknown>[]
      | { headers?: string[]; border?: boolean },
    options?: { headers?: string[]; border?: boolean }
  ): void;
  setLevel(level: LogLevel | LogLevelString): void;
  setConfig(config: Partial<LoggerConfig>): void;
  getConfig(): LoggerConfig;
  isEnabled(level: LogLevel): boolean;
  child(prefix: string): ILogger;
  setHandler(handler: LogHandler | null): void;
  getHandler(): LogHandler | null;
}

/**
 * Type for context strings - provides autocomplete for common contexts
 */
export type LogContextString =
  | 'AUTH'
  | 'DATABASE'
  | 'API'
  | 'CACHE'
  | 'EMAIL'
  | 'PAYMENT'
  | 'NOTIFICATION'
  | 'VALIDATION'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'FILE'
  | 'NETWORK'
  | 'QUEUE'
  | 'SCHEDULER'
  | 'WEBSOCKET'
  | 'GRAPHQL'
  | 'REDIS'
  | 'MONGODB'
  | 'POSTGRES'
  | 'MYSQL'
  | 'ELASTICSEARCH'
  | 'KAFKA'
  | 'RABBITMQ'
  | 'AWS'
  | 'GOOGLE'
  | 'STRIPE'
  | 'TWILIO'
  | 'SENDGRID'
  | 'JWT'
  | 'OAUTH'
  | 'RATE_LIMIT'
  | 'CORS'
  | 'HELMET'
  | 'COMPRESSION'
  | 'STATIC'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'EXPORT'
  | 'IMPORT'
  | 'BACKUP'
  | 'RESTORE'
  | 'MIGRATION'
  | 'SEED'
  | 'TEST'
  | 'E2E'
  | 'UNIT'
  | 'INTEGRATION'
  | 'BENCHMARK'
  | 'PROFILING'
  | 'MONITORING'
  | 'ALERTING'
  | 'METRICS'
  | 'HEALTH'
  | 'READINESS'
  | 'LIVENESS'
  | 'GRACEFUL_SHUTDOWN'
  | 'STARTUP'
  | 'SHUTDOWN'
  | 'RELOAD'
  | 'HOT_RELOAD'
  | 'DEBUG'
  | 'TRACE'
  | 'VERBOSE'
  | 'SILENT';

/**
 * Chalk color function type
 */
export type ChalkColor = (text: string) => string;

/**
 * Chalk instance type
 */
export interface ChalkInstance {
  red: ChalkColor;
  green: ChalkColor;
  blue: ChalkColor;
  yellow: ChalkColor;
  magenta: ChalkColor;
  cyan: ChalkColor;
  gray: ChalkColor;
  white: ChalkColor;
  bold: ChalkColor;
  italic: ChalkColor;
  underline: ChalkColor;
  inverse: ChalkColor;
  strikethrough: ChalkColor;
}

/**
 * Log callback parameters for custom handlers
 */
export interface LogCallbackParams {
  level: LogLevelString;
  message: string;
  data?: LogData;
  timestamp: Date;
  source?: string;
  prefix?: string;
  loggerName?: string;
}

/**
 * Custom log handler function type
 */
export type LogHandler = (params: LogCallbackParams) => void;

/**
 * Strategy Pattern - Formatter Strategy Interface
 */
export interface ILogFormatter {
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

/**
 * Bridge Pattern - Implementation Interface
 */
export interface ILogImplementation {
  write(output: string): void;
  getSourceInfo(): string;
}

/**
 * Abstract Factory Pattern - Logger Factory Interface
 */
export interface ILoggerFactory {
  createLogger(config?: Partial<LoggerConfig>): ILogger;

  createMinimalLogger(config?: Partial<LoggerConfig>): ILogger;
}

/**
 * Builder Pattern - Logger Builder Interface
 */
export interface ILoggerBuilder {
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
