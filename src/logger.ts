import { ColoredTextFormatter } from './formatters';
import { ConsoleLogImplementation } from './implementations';
import { loggerRegistry } from './registry';
import {
  type ILogFormatter,
  type ILogImplementation,
  type ILogger,
  type LogCallbackParams,
  type LogData,
  type LogEntry,
  type LogHandler,
  LogLevel,
  type LogLevelString,
  type LoggerConfig,
  logLevelToString,
  stringToLogLevel,
} from './types';

/**
 * Bridge Pattern - Logger Abstraction
 * A customizable logger class that separates abstraction from implementation
 * Provides flexible logging with configurable levels, timestamps, source information,
 * and output formats (human-readable or JSON).
 *
 * @example
 * ```typescript
 * const logger = new Logger({ level: LogLevel.INFO, prefix: 'App' });
 * logger.info('Application started');
 * logger.error('Database connection failed', { errorCode: 'DB001' });
 * ```
 */
export class Logger implements ILogger {
  private config: LoggerConfig;
  private readonly implementation: ILogImplementation;
  private readonly formatter: ILogFormatter;
  private _handler: LogHandler | null = null;

  /**
   * Creates a new Logger instance with the specified configuration.
   *
   * @param config - Configuration options for the logger. All options are optional
   *                 and have sensible defaults.
   *
   * @example
   * ```typescript
   * // Basic usage with defaults
   * const logger = new Logger();
   *
   * // Custom configuration
   * const logger = new Logger({
   *   level: LogLevel.DEBUG,
   *   prefix: 'MyApp',
   *   colors: true,
   *   timestamps: false, // Disabled by default, shows source info instead
   *   showSource: true   // Enabled by default
   * });
   *
   * // JSON output for production
   * const logger = new Logger({
   *   json: true,
   *   colors: false,
   *   level: LogLevel.WARN,
   *   timestamps: true  // Enable timestamps for production logs
   * });
   * ```
   */
  constructor(
    config: LoggerConfig = {},
    formatter?: ILogFormatter,
    implementation?: ILogImplementation
  ) {
    this.config = {
      level: LogLevel.INFO,
      timestamps: false, // Disable timestamps by default
      colors: true,
      timestampFormat: 'HH:mm:ss',
      showSource: true, // Enable source info by default
      prefix: '',
      json: false,
      output: process.stdout,
      ...config,
    };

    // Use provided formatter or fallback to ColoredTextFormatter
    this.formatter = formatter || new ColoredTextFormatter();

    this.implementation =
      implementation || new ConsoleLogImplementation(this.config.output);

    // Register with global registry
    loggerRegistry.register(this);
  }

  /**
   * Logs an error message with optional additional data.
   *
   * @param message - The error message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.error('Failed to connect to database', { errorCode: 'DB001', retryCount: 3 });
   * ```
   */
  error(message: string, data?: LogData): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Logs a warning message with optional additional data.
   *
   * @param message - The warning message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.warn('Low memory warning', { memoryUsage: '85%' });
   * ```
   */
  warn(message: string, data?: LogData): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs an informational message with optional additional data.
   *
   * @param message - The info message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.info('User logged in', { userId: '12345' });
   * ```
   */
  info(message: string, data?: LogData): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a debug message with optional additional data.
   *
   * @param message - The debug message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.debug('Processing request', { requestId: 'abc123' });
   * ```
   */
  debug(message: string, data?: LogData): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs a trace message with optional additional data.
   *
   * @param message - The trace message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.trace('Function called', { function: 'processUserData', args: { id: 1 } });
   * ```
   */
  trace(message: string, data?: LogData): void {
    this.log(LogLevel.TRACE, message, data);
  }

  /**
   * Logs a message with the specified log level and optional data.
   *
   * @param level - The log level (ERROR, WARN, INFO, DEBUG, TRACE).
   * @param message - The message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @remarks
   * The message is only logged if the specified level is enabled based on the configured minimum log level.
   */
  log(level: LogLevel, message: string, data?: LogData): void {
    if (!this.isEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      prefix: this.config.prefix,
      source: this.implementation.getSourceInfo(), // Always capture source info
    };

    // Call custom handler if set
    const handler = this.getHandler();
    if (handler) {
      const callbackParams: LogCallbackParams = {
        level: logLevelToString(level),
        message: entry.message,
        data: entry.data,
        timestamp: entry.timestamp,
        source: entry.source,
        prefix: entry.prefix,
        loggerName: this.config.prefix || 'default',
      };
      handler(callbackParams);
    }

    // Format output using formatter
    let output: string;
    if (this.config.json) {
      output = this.formatter.formatJson(entry);
    } else {
      output = this.formatter.formatText(entry, this.config);
    }
    this.implementation.write(output);
  }

  /**
   * Sets the minimum log level for this logger instance.
   *
   * Only messages at or above the specified level will be output.
   * Log levels are hierarchical: ERROR < WARN < INFO < DEBUG < TRACE
   *
   * @param level - The minimum log level to output
   *
   * @example
   * ```typescript
   * const logger = new Logger();
   *
   * // Only show errors and warnings
   * logger.setLevel(LogLevel.WARN);
   * logger.info('This will not be shown'); // Hidden
   * logger.warn('This will be shown');     // Visible
   *
   * // Show all messages including debug
   * logger.setLevel(LogLevel.DEBUG);
   * logger.debug('Now this is visible');
   * ```
   */
  setLevel(level: LogLevel | LogLevelString): void {
    if (typeof level === 'string') {
      this.config.level = stringToLogLevel(level);
    } else {
      this.config.level = level;
    }
  }

  /**
   * Updates the logger configuration with new settings.
   *
   * This method merges the provided configuration with the existing one,
   * allowing you to update unknown combination of settings without losing
   * other configured values.
   *
   * @param config - Partial configuration to merge with current settings
   *
   * @example
   * ```typescript
   * const logger = new Logger();
   *
   * // Update multiple settings at once
   * logger.setConfig({
   *   level: LogLevel.DEBUG,
   *   prefix: 'API',
   *   showSource: true
   * });
   *
   * // Switch to JSON output for production
   * logger.setConfig({
   *   json: true,
   *   colors: false,
   *   level: LogLevel.WARN
   * });
   * ```
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Returns a copy of the current logger configuration.
   *
   * This method returns a shallow copy of the configuration object,
   * so modifying the returned object won't affect the logger's settings.
   *
   * @returns A copy of the current LoggerConfig
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.DEBUG, prefix: 'App' });
   *
   * const config = logger.getConfig();
   * logger.log(config.level); // LogLevel.DEBUG
   * logger.log(config.prefix); // 'App'
   *
   * // The returned config is a copy, so it's safe to modify
   * config.level = LogLevel.INFO; // Doesn't affect the logger
   * ```
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Checks if a specific log level is enabled for this logger.
   *
   * A log level is considered enabled if it is at or above the configured
   * minimum log level. This is useful for conditional logging or performance
   * optimization.
   *
   * @param level - The log level to check
   * @returns `true` if the level is enabled, `false` otherwise
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.WARN });
   *
   * logger.isEnabled(LogLevel.ERROR); // true
   * logger.isEnabled(LogLevel.WARN);  // true
   * logger.isEnabled(LogLevel.INFO);  // false
   * logger.isEnabled(LogLevel.DEBUG); // false
   *
   * // Use for conditional logging
   * if (logger.isEnabled(LogLevel.DEBUG)) {
   *   const expensiveData = computeExpensiveData();
   *   logger.debug('Expensive data computed', expensiveData);
   * }
   * ```
   */
  isEnabled(level: LogLevel): boolean {
    return level <= (this.config.level || LogLevel.INFO);
  }

  /**
   * Creates a child logger that inherits all configuration from this logger
   * but adds a prefix to all log messages.
   *
   * Child loggers are useful for organizing logs by module, component, or
   * unknown other logical grouping. They maintain all the parent's settings
   * including colors, timestamps, and log levels.
   *
   * @param prefix - The prefix to add to all log messages from this child logger
   * @returns A new Logger instance with the specified prefix
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.DEBUG });
   *
   * const dbLogger = logger.child('Database');
   * const apiLogger = logger.child('API');
   * const authLogger = logger.child('Auth');
   *
   * dbLogger.info('Connection established');
   * apiLogger.info('Request processed');
   * authLogger.warn('Token expired');
   *
   * // Output:
   * // [18:30:15] [Database] [INFO] Connection established
   * // [18:30:16] [API] [INFO] Request processed
   * // [18:30:17] [Auth] [WARN] Token expired
   *
   * // Child loggers can also create their own children
   * const userDbLogger = dbLogger.child('Users');
   * userDbLogger.debug('Query executed', { table: 'users', rows: 42 });
   * // Output: [18:30:18] [Database] [Users] [DEBUG] Query executed
   * ```
   */
  child(prefix: string): Logger {
    const childConfig = { ...this.config, prefix };
    return new Logger(childConfig, this.formatter, this.implementation);
  }

  setHandler(handler: LogHandler | null): void {
    this._handler = handler;
  }

  getHandler(): LogHandler | null {
    return this._handler;
  }

  /**
   * Logs tabular data in a formatted table with colored headers.
   *
   * @param dataOrLevel - The data array or log level (defaults to LogLevel.INFO if data is passed)
   * @param dataOrOptions - The data array (if level was specified) or options
   * @param options - Optional configuration for table display
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.INFO, prefix: 'App' });
   * const data = [
   *   { name: 'Alice', age: 25, role: 'Engineer' },
   *   { name: 'Bob', age: 30, role: 'Designer' }
   * ];
   *
   * // Simple usage (defaults to INFO level)
   * logger.table(data);
   *
   * // With specific log level
   * logger.table(LogLevel.DEBUG, data);
   *
   * // With options
   * logger.table(data, { headers: ['Person', 'Years', 'Job'], border: false });
   *
   * // With level and options
   * logger.table(LogLevel.WARN, data, { border: false });
   * ```
   */
  table(
    dataOrLevel: LogLevel | Record<string, unknown>[] | Record<string, unknown>,
    dataOrOptions?:
      | Record<string, unknown>[]
      | { headers?: string[]; border?: boolean },
    options: { headers?: string[]; border?: boolean } = {}
  ): void {
    let level: LogLevel;
    let data: Record<string, unknown>[];
    let finalOptions: { headers?: string[]; border?: boolean };

    if (Array.isArray(dataOrLevel)) {
      level = LogLevel.INFO;
      data = dataOrLevel;
      finalOptions =
        (dataOrOptions as { headers?: string[]; border?: boolean }) || {};
    } else if (
      typeof dataOrLevel === 'object' &&
      dataOrLevel !== null &&
      !Array.isArray(dataOrLevel) &&
      typeof dataOrLevel !== 'number'
    ) {
      // Handle single object case (key-value pairs)
      level = LogLevel.INFO;
      data = [dataOrLevel];
      finalOptions =
        (dataOrOptions as { headers?: string[]; border?: boolean }) || {};
    } else {
      level = dataOrLevel as LogLevel;
      data = dataOrOptions as Record<string, unknown>[];
      finalOptions = options;
    }

    if (!this.isEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message: 'TABLE_DATA:',
      timestamp: new Date(),
      data,
      prefix: this.config.prefix,
      source: this.implementation.getSourceInfo(), // Always capture source info
    };

    if (this.config.json) {
      const output = this.formatter.formatJson(entry);
      this.implementation.write(output);
    } else {
      const outputs = this.formatter.formatTable(
        entry,
        data,
        this.config,
        finalOptions
      );
      for (const output of outputs) {
        this.implementation.write(`${output}\n`);
      }
    }
  }
}
