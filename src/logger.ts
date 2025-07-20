import chalk from 'chalk';
import {
  type ChalkColor,
  type ILogger,
  type LogData,
  type LogEntry,
  LogLevel,
  type LoggerConfig,
} from './types';

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
  private levelNames = {
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.TRACE]: 'TRACE',
  };

  private levelTagColors: Record<LogLevel, ChalkColor> = {
    [LogLevel.ERROR]: chalk.red.bold,
    [LogLevel.WARN]: chalk.yellow.bold,
    [LogLevel.INFO]: chalk.blue.bold,
    [LogLevel.DEBUG]: chalk.green.bold,
    [LogLevel.TRACE]: chalk.gray.bold,
  };

  private messageColors: Record<LogLevel, ChalkColor> = {
    [LogLevel.ERROR]: chalk.red,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.INFO]: chalk.blue,
    [LogLevel.DEBUG]: chalk.green,
    [LogLevel.TRACE]: chalk.gray,
  };

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

    // Add source information if enabled
    if (this.config.showSource) {
      entry.source = this.getSourceInfo();
    }

    const output = this.formatLogEntry(entry);
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
   * allowing you to update any combination of settings without losing
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
   * Format a log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.json) {
      return this.formatJson(entry);
    }
    return this.formatText(entry);
  }

  /**
   * Format log entry as JSON
   */
  private formatJson(entry: LogEntry): string {
    const jsonEntry = {
      timestamp: entry.timestamp.toISOString(),
      level: this.levelNames[entry.level],
      message: entry.message,
      ...(entry.source && { source: entry.source }),
      ...(entry.data && { data: entry.data }),
      ...(entry.prefix && { prefix: entry.prefix }),
    };

    return `${JSON.stringify(jsonEntry)}\n`;
  }

  /**
   * Format log entry as colored text
   */
  private formatText(entry: LogEntry): string {
    const parts: string[] = [];

    this.addTimestamp(parts, entry);
    this.addPrefix(parts, entry);
    this.addLevelTag(parts, entry);
    this.addSource(parts, entry);
    this.addMessage(parts, entry);
    this.addData(parts, entry);

    return `${parts.join(' ')}\n`;
  }

  private addTimestamp(parts: string[], entry: LogEntry): void {
    if (!this.config.timestamps) return;

    const timestamp = entry.timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    parts.push(this.config.colors ? chalk.gray(`[${timestamp}]`) : `[${timestamp}]`);
  }

  private addPrefix(parts: string[], entry: LogEntry): void {
    if (!entry.prefix) return;
    parts.push(this.config.colors ? chalk.cyan(`[${entry.prefix}]`) : `[${entry.prefix}]`);
  }

  private addLevelTag(parts: string[], entry: LogEntry): void {
    const levelName = this.levelNames[entry.level];
    const levelTagColor = this.levelTagColors[entry.level];
    parts.push(this.config.colors ? levelTagColor(`[${levelName}]`) : `[${levelName}]`);
  }

  private addSource(parts: string[], entry: LogEntry): void {
    if (!entry.source) return;
    parts.push(this.config.colors ? chalk.magenta(`[${entry.source}]`) : `[${entry.source}]`);
  }

  private addMessage(parts: string[], entry: LogEntry): void {
    const messageColor = this.messageColors[entry.level];
    parts.push(this.config.colors ? messageColor(entry.message) : entry.message);
  }

  private addData(parts: string[], entry: LogEntry): void {
    if (entry.data === undefined) return;

    let dataStr: string;
    if (typeof entry.data === 'object') {
      try {
        dataStr = JSON.stringify(entry.data, null, 2);
      } catch (_error) {
        dataStr = '[Circular or non-serializable object]';
      }
    } else {
      dataStr = String(entry.data);
    }
    parts.push(this.config.colors ? chalk.gray(dataStr) : dataStr);
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
    // Skip the first few lines (Error constructor, Logger methods)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('node_modules') || line.includes('packages/logger')) {
        continue;
      }

      // Extract file and line information
      const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName = filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
    }

    return 'unknown';
  }

  /**
   * Creates a child logger that inherits all configuration from this logger
   * but adds a prefix to all log messages.
   *
   * Child loggers are useful for organizing logs by module, component, or
   * any other logical grouping. They maintain all the parent's settings
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
   * Creates a logger configured for JSON output, ideal for production environments
   * and log aggregation systems.
   *
   * This factory method creates a logger with JSON formatting enabled and colors
   * disabled, making it suitable for machine-readable logs and integration with
   * log management systems like ELK Stack, Splunk, or CloudWatch.
   *
   * @param config - Additional configuration options to merge with JSON defaults
   * @returns A Logger instance configured for JSON output
   *
   * @example
   * ```typescript
   * const logger = Logger.createJsonLogger({ level: LogLevel.WARN });
   *
   * logger.warn('High memory usage detected', {
   *   memoryUsage: '85%',
   *   threshold: '80%'
   * });
   *
   * // Output:
   * // {"timestamp":"2024-01-15T18:30:00.000Z","level":"WARN","message":"High memory usage detected","data":{"memoryUsage":"85%","threshold":"80%"}}
   *
   * // For production with custom output
   * const productionLogger = Logger.createJsonLogger({
   *   output: fs.createWriteStream('app.log'),
   *   level: LogLevel.ERROR
   * });
   * ```
   */
  static createJsonLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({ ...config, json: true, colors: false });
  }

  /**
   * Creates a logger with minimal output formatting, ideal for simple console output
   * or when you want clean, uncluttered logs.
   *
   * This factory method creates a logger with timestamps, colors, and source
   * information disabled, providing the most basic logging experience.
   *
   * @param config - Additional configuration options to merge with minimal defaults
   * @returns A Logger instance configured for minimal output
   *
   * @example
   * ```typescript
   * const logger = Logger.createMinimalLogger({ level: LogLevel.INFO });
   *
   * logger.info('Simple message');
   * logger.error('Error occurred');
   *
   * // Output:
   * // [INFO] Simple message
   * // [ERROR] Error occurred
   *
   * // With custom prefix
   * const appLogger = Logger.createMinimalLogger({
   *   prefix: 'App',
   *   level: LogLevel.WARN
   * });
   * appLogger.warn('Warning message');
   * // Output: [App] [WARN] Warning message
   * ```
   */
  static createMinimalLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      timestamps: false,
      colors: false,
      showSource: false,
    });
  }

  /**
   * Creates a logger with verbose output formatting, ideal for development and debugging.
   *
   * This factory method creates a logger with all features enabled: TRACE level logging,
   * timestamps, colors, and source file information. This provides the most detailed
   * logging experience for development and troubleshooting.
   *
   * @param config - Additional configuration options to merge with verbose defaults
   * @returns A Logger instance configured for verbose output
   *
   * @example
   * ```typescript
   * const logger = Logger.createVerboseLogger();
   *
   * logger.trace('Function called', { function: 'processUser', args: { id: 123 } });
   * logger.debug('Processing data', { dataSize: 1024, format: 'json' });
   * logger.info('User authenticated', { userId: 'abc123', method: 'jwt' });
   *
   * // Output:
   * // [18:30:15] [TRACE] [app.js:42] Function called {"function":"processUser","args":{"id":123}}
   * // [18:30:16] [DEBUG] [app.js:45] Processing data {"dataSize":1024,"format":"json"}
   * // [18:30:17] [INFO] [app.js:48] User authenticated {"userId":"abc123","method":"jwt"}
   *
   * // With custom prefix for module-specific logging
   * const debugLogger = Logger.createVerboseLogger({
   *   prefix: 'Debug',
   *   output: process.stderr // Log to stderr for debug info
   * });
   * ```
   */
  static createVerboseLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      level: LogLevel.TRACE,
      timestamps: true,
      colors: true,
      showSource: true,
    });
  }
}
