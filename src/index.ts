export { Logger } from './logger';
export { LogLevel } from './types';
export type { LoggerConfig, LogEntry, ILogger, LogData } from './types';

// Default logger instance
import { Logger } from './logger';
import type { LogData, LogLevel, LoggerConfig } from './types';

/**
 * Default logger instance with INFO level and sensible defaults.
 *
 * This is a pre-configured logger instance that you can use immediately
 * without any setup. It includes timestamps, colors, and INFO level logging.
 *
 * @example
 * ```typescript
 * import { logger } from '@calphonse/logger';
 *
 * logger.info('Application started');
 * logger.error('Something went wrong', { errorCode: 'ERR001' });
 * ```
 */
export const logger = new Logger();

/**
 * Convenience functions for quick logging using the default logger instance.
 *
 * These functions provide a simple way to log messages without creating
 * a logger instance. They use the global logger instance internally.
 *
 * @example
 * ```typescript
 * import { log } from '@calphonse/logger';
 *
 * log.info('User logged in', { userId: '12345' });
 * log.error('Database connection failed', { errorCode: 'DB001' });
 * ```
 */
export const log = {
  /**
   * Log an error message with optional data
   * @param message - The error message to log
   * @param data - Optional metadata or additional details
   */
  error: (message: string, data?: LogData) => logger.error(message, data),

  /**
   * Log a warning message with optional data
   * @param message - The warning message to log
   * @param data - Optional metadata or additional details
   */
  warn: (message: string, data?: LogData) => logger.warn(message, data),

  /**
   * Log an info message with optional data
   * @param message - The info message to log
   * @param data - Optional metadata or additional details
   */
  info: (message: string, data?: LogData) => logger.info(message, data),

  /**
   * Log a debug message with optional data
   * @param message - The debug message to log
   * @param data - Optional metadata or additional details
   */
  debug: (message: string, data?: LogData) => logger.debug(message, data),

  /**
   * Log a trace message with optional data
   * @param message - The trace message to log
   * @param data - Optional metadata or additional details
   */
  trace: (message: string, data?: LogData) => logger.trace(message, data),
};

/**
 * Create a new logger instance with custom configuration.
 *
 * This function creates a fresh logger instance with the specified configuration.
 * If no configuration is provided, it uses sensible defaults.
 *
 * @param config - Optional configuration options for the logger
 * @returns A new Logger instance
 *
 * @example
 * ```typescript
 * import { createLogger, LogLevel } from '@calphonse/logger';
 *
 * const customLogger = createLogger({
 *   level: LogLevel.DEBUG,
 *   prefix: 'API',
 *   colors: true,
 *   timestamps: true
 * });
 *
 * customLogger.debug('Request received', { method: 'GET', path: '/users' });
 * ```
 */
export const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);

/**
 * Create a child logger with a prefix using the default logger instance.
 *
 * Child loggers inherit all configuration from their parent but add a prefix
 * to all log messages. This is useful for organizing logs by module or component.
 *
 * @param prefix - The prefix to add to all log messages from this child logger
 * @returns A new Logger instance with the specified prefix
 *
 * @example
 * ```typescript
 * import { createChildLogger } from '@calphonse/logger';
 *
 * const dbLogger = createChildLogger('Database');
 * const apiLogger = createChildLogger('API');
 *
 * dbLogger.info('Connection established');
 * apiLogger.info('Request processed');
 *
 * // Output:
 * // [18:30:15] [Database] [INFO] Connection established
 * // [18:30:16] [API] [INFO] Request processed
 * ```
 */
export const createChildLogger = (prefix: string) => logger.child(prefix);

/**
 * Set the log level for the default logger instance.
 *
 * This function allows you to dynamically change the minimum log level
 * for the global logger instance. Only messages at or above this level
 * will be output.
 *
 * @param level - The minimum log level to output (ERROR, WARN, INFO, DEBUG, TRACE)
 *
 * @example
 * ```typescript
 * import { setLogLevel, LogLevel, log } from '@calphonse/logger';
 *
 * // Only show errors and warnings
 * setLogLevel(LogLevel.WARN);
 *
 * log.info('This will not be shown'); // Hidden
 * log.warn('This will be shown');     // Visible
 * log.error('This will be shown');    // Visible
 *
 * // Show all messages including debug
 * setLogLevel(LogLevel.DEBUG);
 * log.debug('Now debug messages are visible');
 * ```
 */
export const setLogLevel = (level: LogLevel) => logger.setLevel(level);

/**
 * Configure the default logger instance with new settings.
 *
 * This function allows you to update the configuration of the global logger
 * instance. You can change any combination of settings including log level,
 * colors, timestamps, and output format.
 *
 * @param config - Partial configuration to apply to the logger
 *
 * @example
 * ```typescript
 * import { configureLogger, LogLevel, log } from '@calphonse/logger';
 *
 * // Enable JSON output for production
 * configureLogger({
 *   json: true,
 *   colors: false,
 *   level: LogLevel.WARN
 * });
 *
 * log.warn('Production warning');
 * // Output: {"timestamp":"2024-01-15T18:30:00.000Z","level":"WARN","message":"Production warning"}
 *
 * // Switch back to human-readable format for development
 * configureLogger({
 *   json: false,
 *   colors: true,
 *   level: LogLevel.DEBUG
 * });
 * ```
 */
export const configureLogger = (config: Partial<LoggerConfig>) => logger.setConfig(config);

/**
 * Default export of the logger instance.
 *
 * This is the same as the named export `logger`. You can use either:
 *
 * ```typescript
 * import logger from '@calphonse/logger';
 * // or
 * import { logger } from '@calphonse/logger';
 * ```
 */
export default logger;
