import { Logger } from './logger';
import { LogLevel, type LoggerConfig } from './types';

/**
 * Logger factory functions for creating specialized logger instances
 */
export const LoggerFactory = {
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
   * const logger = LoggerFactory.createJsonLogger({ level: LogLevel.WARN });
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
   * const productionLogger = LoggerFactory.createJsonLogger({
   *   output: fs.createWriteStream('app.log'),
   *   level: LogLevel.ERROR
   * });
   * ```
   */
  createJsonLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({ ...config, json: true, colors: false });
  },

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
   * const logger = LoggerFactory.createMinimalLogger({ level: LogLevel.INFO });
   *
   * logger.info('Simple message');
   * logger.error('Error occurred');
   *
   * // Output:
   * // [INFO] Simple message
   * // [ERROR] Error occurred
   *
   * // With custom prefix
   * const appLogger = LoggerFactory.createMinimalLogger({
   *   prefix: 'App',
   *   level: LogLevel.WARN
   * });
   * appLogger.warn('Warning message');
   * // Output: [App] [WARN] Warning message
   * ```
   */
  createMinimalLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      timestamps: false,
      colors: false,
      showSource: false,
    });
  },

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
   * const logger = LoggerFactory.createVerboseLogger();
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
   * const debugLogger = LoggerFactory.createVerboseLogger({
   *   prefix: 'Debug',
   *   output: process.stderr // Log to stderr for debug info
   * });
   * ```
   */
  createVerboseLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      level: LogLevel.TRACE,
      timestamps: true,
      colors: true,
      showSource: true,
    });
  },
};
