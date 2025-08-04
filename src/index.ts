export { Logger } from './logger';
export { LogLevel } from './types';
export type { LoggerConfig, LogEntry, ILogger, LogData } from './types';
export { LoggerFactory } from './factories';
export { LogFormatter } from './formatters';

import { LoggerFactory } from './factories';
import { Logger } from './logger';
import { LogLevel } from './types';
import type { LogData, LoggerConfig } from './types';

/**
 * Default logger instance with INFO level and sensible defaults.
 *
 * This is a pre-configured logger instance that you can use immediately
 * without any setup. It includes timestamps, colors, and INFO level logging.
 *
 * @example
 * ```typescript
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * logger.info('Application started');
 *
 * try {
 *   // some code that might fail
 * } catch (error) {
 *   logger.error('Something went wrong', error);
 * }
 * ```
 */
const defaultLogger = new Logger();

/**
 * Convenience functions for quick logging using the default logger instance.
 *
 * These functions provide a simple way to log messages without creating
 * a logger instance. They use the global logger instance internally.
 *
 * @example
 * ```typescript
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * logger.log.info('User logged in', { userId: '12345' });
 * logger.log.error('Database connection failed', { errorCode: 'DB001' });
 * ```
 */
const log = {
  /**
   * Log an error message with optional data
   * @param message - The error message to log
   * @param data - Optional metadata or additional details
   */
  error: (message: string, data?: LogData) =>
    defaultLogger.error(message, data),

  /**
   * Log a warning message with optional data
   * @param message - The warning message to log
   * @param data - Optional metadata or additional details
   */
  warn: (message: string, data?: LogData) => defaultLogger.warn(message, data),

  /**
   * Log an info message with optional data
   * @param message - The info message to log
   * @param data - Optional metadata or additional details
   */
  info: (message: string, data?: LogData) => defaultLogger.info(message, data),

  /**
   * Log a debug message with optional data
   * @param message - The debug message to log
   * @param data - Optional metadata or additional details
   */
  debug: (message: string, data?: LogData) =>
    defaultLogger.debug(message, data),

  /**
   * Log a trace message with optional data
   * @param message - The trace message to log
   * @param data - Optional metadata or additional details
   */
  trace: (message: string, data?: LogData) =>
    defaultLogger.trace(message, data),
};

/**
 * Create a new logger instance with custom configuration.
 *
 * This function creates a fresh logger instance with the specified configuration.
 * If no configuration is provided, it uses sensible defaults. Returns the enhanced
 * logger with AI capabilities by default.
 *
 * @param config - Optional configuration options for the logger
 * @param enhanced - Whether to create an enhanced logger with AI capabilities (default: true)
 * @returns A new Logger or EnhancedLogger instance
 *
 * @example
 * ```typescript
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * // Enhanced logger with AI (default)
 * const aiLogger = logger.createLogger({
 *   level: logger.LogLevel.DEBUG,
 *   prefix: 'API',
 *   colors: true,
 *   timestamps: true
 * });
 *
 * // Traditional logger (without AI)
 * const basicLogger = logger.createLogger({
 *   level: logger.LogLevel.DEBUG,
 *   prefix: 'API'
 * }, false);
 *
 * // AI will analyze errors automatically!
 * try {
 *   // your code
 * } catch (error) {
 *   aiLogger.error('Request failed', error);
 * }
 * ```
 */
const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);

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
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * const dbLogger = logger.createChildLogger('Database');
 * const apiLogger = logger.createChildLogger('API');
 *
 * dbLogger.info('Connection established');
 * apiLogger.info('Request processed');
 *
 * // Output:
 * // [18:30:15] [Database] [INFO] Connection established
 * // [18:30:16] [API] [INFO] Request processed
 * ```
 */
const createChildLogger = (prefix: string) => defaultLogger.child(prefix);

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
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * // Only show errors and warnings
 * logger.setLogLevel(logger.LogLevel.WARN);
 *
 * logger.log.info('This will not be shown'); // Hidden
 * logger.log.warn('This will be shown');     // Visible
 * logger.log.error('This will be shown');    // Visible
 *
 * // Show all messages including debug
 * logger.setLogLevel(logger.LogLevel.DEBUG);
 * logger.log.debug('Now debug messages are visible');
 * ```
 */
const setLogLevel = (level: LogLevel) => defaultLogger.setLevel(level);

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
 * import logger from '@calphonse/logger';
 * // or
 * const logger = require('@calphonse/logger');
 *
 * // Enable JSON output for production
 * logger.configureLogger({
 *   json: true,
 *   colors: false,
 *   level: logger.LogLevel.WARN
 * });
 *
 * logger.log.warn('Production warning');
 * // Output: {"timestamp":"2024-01-15T18:30:00.000Z","level":"WARN","message":"Production warning"}
 *
 * // Switch back to human-readable format for development
 * logger.configureLogger({
 *   json: false,
 *   colors: true,
 *   level: logger.LogLevel.DEBUG
 * });
 * ```
 */
const configureLogger = (config: Partial<LoggerConfig>) =>
  defaultLogger.setConfig(config);

const mainLogger = {
  error: defaultLogger.error.bind(defaultLogger),
  warn: defaultLogger.warn.bind(defaultLogger),
  info: defaultLogger.info.bind(defaultLogger),
  debug: defaultLogger.debug.bind(defaultLogger),
  trace: defaultLogger.trace.bind(defaultLogger),
  setLevel: defaultLogger.setLevel.bind(defaultLogger),
  setConfig: defaultLogger.setConfig.bind(defaultLogger),
  getConfig: defaultLogger.getConfig.bind(defaultLogger),
  child: defaultLogger.child.bind(defaultLogger),
  isEnabled: defaultLogger.isEnabled.bind(defaultLogger),

  log: log,
  createLogger,
  createChildLogger,
  setLogLevel,
  configureLogger,
  LogLevel,
  Logger,

  // Factory methods for backward compatibility
  createJsonLogger: LoggerFactory.createJsonLogger,
  createMinimalLogger: LoggerFactory.createMinimalLogger,
  createVerboseLogger: LoggerFactory.createVerboseLogger,

  // Export factory class
  LoggerFactory,
};

export const logger = mainLogger;
export { log, createLogger, createChildLogger, setLogLevel, configureLogger };

/**
 * Default export that provides the main logger instance with all utility functions.
 *
 * This allows both ESM and CommonJS users to access the logger directly:
 *
 * ESM:
 * ```typescript
 * import logger from '@calphonse/logger';
 * logger.info('Hello world');
 * logger.log.error('Something went wrong');
 * const custom = logger.createLogger({ level: logger.LogLevel.DEBUG });
 * ```
 *
 * CommonJS:
 * ```javascript
 * const logger = require('@calphonse/logger');
 * logger.info('Hello world');
 * logger.log.error('Something went wrong');
 * const custom = logger.createLogger({ level: logger.LogLevel.DEBUG });
 * ```
 */
export default mainLogger;
