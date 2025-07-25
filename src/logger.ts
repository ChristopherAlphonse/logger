import { type ILogger, type LogData, type LogEntry, LogLevel, type LoggerConfig } from './types';
import { LogFormatter } from './formatters';
import { LoggerFactory } from './factories';

/**
 * A customizable logger class that wraps console output with color support using chalk.
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
  private formatter: LogFormatter;

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
   *   timestamps: true,
   *   showSource: true
   * });
   *
   * // JSON output for production
   * const logger = new Logger({
   *   json: true,
   *   colors: false,
   *   level: LogLevel.WARN
   * });
   * ```
   */
  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      timestamps: true,
      colors: true,
      timestampFormat: 'HH:mm:ss',
      showSource: false,
      prefix: '',
      json: false,
      output: process.stdout,
      ...config,
    };
    this.formatter = new LogFormatter();
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
    };

    if (this.config.showSource) {
      entry.source = this.getSourceInfo();
    }

    const output = this.formatter.formatLogEntry(entry, this.config);
    this.write(output);
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
  setLevel(level: LogLevel): void {
    this.config.level = level;
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
   * console.log(config.level); // LogLevel.DEBUG
   * console.log(config.prefix); // 'App'
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
    return new Logger(childConfig);
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
    dataOrLevel: LogLevel | Record<string, unknown>[],
    dataOrOptions?: Record<string, unknown>[] | { headers?: string[]; border?: boolean },
    options: { headers?: string[]; border?: boolean } = {}
  ): void {
    let level: LogLevel;
    let data: Record<string, unknown>[];
    let finalOptions: { headers?: string[]; border?: boolean };

    if (Array.isArray(dataOrLevel)) {
      level = LogLevel.INFO;
      data = dataOrLevel;
      finalOptions = (dataOrOptions as { headers?: string[]; border?: boolean }) || {};
    } else {
      level = dataOrLevel;
      data = dataOrOptions as Record<string, unknown>[];
      finalOptions = options;
    }

    if (!this.isEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message: 'Table data',
      timestamp: new Date(),
      data,
      prefix: this.config.prefix,
    };

    if (this.config.showSource) {
      entry.source = this.getSourceInfo();
    }

    if (this.config.json) {
      const output = this.formatter.formatJson(entry);
      this.write(output);
    } else {
      const outputs = this.formatter.formatTable(entry, data, this.config, finalOptions);
      for (const output of outputs) {
        this.write(output);
      }
    }
  }

  /**
   * Write output to the configured stream
   */
  private write(output: string): void {
    const stream = this.config.output || process.stdout;
    stream.write(output);
  }

  /**
   * Get source file information for the calling function
   */
  private getSourceInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('node_modules') || line.includes('packages/logger')) {
        continue;
      }

      const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName = filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
    }

    return 'unknown';
  }

  // Static factory methods for backward compatibility
  /**
   * Creates a logger configured for JSON output, ideal for production environments
   * and log aggregation systems.
   *
   * @deprecated Use LoggerFactory.createJsonLogger() instead
   */
  static createJsonLogger(config: Partial<LoggerConfig> = {}): Logger {
    return LoggerFactory.createJsonLogger(config);
  }

  /**
   * Creates a logger with minimal output formatting, ideal for simple console output
   * or when you want clean, uncluttered logs.
   *
   * @deprecated Use LoggerFactory.createMinimalLogger() instead
   */
  static createMinimalLogger(config: Partial<LoggerConfig> = {}): Logger {
    return LoggerFactory.createMinimalLogger(config);
  }

  /**
   * Creates a logger with verbose output formatting, ideal for development and debugging.
   *
   * @deprecated Use LoggerFactory.createVerboseLogger() instead
   */
  static createVerboseLogger(config: Partial<LoggerConfig> = {}): Logger {
    return LoggerFactory.createVerboseLogger(config);
  }
}
