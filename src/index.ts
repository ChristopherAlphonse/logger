import { Logger } from './logger';

import {
  type IEnhancedLogger,
  type ILogger,
  type LogContextString,
  type LogData,
  type LogHandler,
  LogLevel,
  type LogLevelString,
  type LoggerConfig,
} from './types';

// Re-export all types and classes for advanced users
export * from './types';
export * from './logger';
export * from './builders';
export * from './factories';
export * from './implementations';
export * from './registry';
export * from './formatters';

/**
 * Enhanced Logger class that provides a console-like API with context support
 */
export class EnhancedLogger implements IEnhancedLogger {
  private logger: Logger;

  constructor(config: LoggerConfig = {}) {
    this.logger = new Logger(config);
  }

  /**
   * Log a message with optional data and contexts
   * @param message - The message to log
   * @param data - Optional data object or any console-compatible data
   * @param contexts - Optional array of context strings
   */
  log(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    // Handle different parameter combinations
    let actualData: LogData | undefined;
    let actualContexts: LogContextString[] = [];

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      // data is actually contexts array
      actualContexts = data as LogContextString[];
    } else if (contexts) {
      // data is data, contexts is contexts
      actualData = data as LogData;
      actualContexts = contexts;
    } else {
      // data is data, no contexts
      actualData = data as LogData;
    }

    // Create context prefix
    const contextPrefix = actualContexts.length > 0 ? `[${actualContexts.join('][')}]` : '';

    // Use child logger with context prefix if contexts provided
    const targetLogger = contextPrefix ? this.logger.child(contextPrefix) : this.logger;

    // Log with INFO level by default
    targetLogger.info(message, actualData);
  }

  /**
   * Log an error with optional data and contexts
   */
  error(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    this._logWithLevel(LogLevel.ERROR, message, data, contexts);
  }

  /**
   * Log a warning with optional data and contexts
   */
  warn(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    this._logWithLevel(LogLevel.WARN, message, data, contexts);
  }

  /**
   * Log info with optional data and contexts
   */
  info(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    this._logWithLevel(LogLevel.INFO, message, data, contexts);
  }

  /**
   * Log debug with optional data and contexts
   */
  debug(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    this._logWithLevel(LogLevel.DEBUG, message, data, contexts);
  }

  /**
   * Log trace with optional data and contexts
   */
  trace(message: string, data?: LogData | LogContextString[], contexts?: LogContextString[]): void {
    this._logWithLevel(LogLevel.TRACE, message, data, contexts);
  }

  /**
   * Internal method to handle logging with level and context parsing
   */
  private _logWithLevel(
    level: LogLevel,
    message: string,
    data?: LogData | LogContextString[],
    contexts?: LogContextString[]
  ): void {
    let actualData: LogData | undefined;
    let actualContexts: LogContextString[] = [];

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      actualContexts = data as LogContextString[];
    } else if (contexts) {
      actualData = data as LogData;
      actualContexts = contexts;
    } else {
      actualData = data as LogData;
    }

    const contextPrefix = actualContexts.length > 0 ? `[${actualContexts.join('][')}]` : '';

    const targetLogger = contextPrefix ? this.logger.child(contextPrefix) : this.logger;

    switch (level) {
      case LogLevel.ERROR:
        targetLogger.error(message, actualData);
        break;
      case LogLevel.WARN:
        targetLogger.warn(message, actualData);
        break;
      case LogLevel.INFO:
        targetLogger.info(message, actualData);
        break;
      case LogLevel.DEBUG:
        targetLogger.debug(message, actualData);
        break;
      case LogLevel.TRACE:
        targetLogger.trace(message, actualData);
        break;
      default:
        targetLogger.log(level, message, actualData);
    }
  }

  // Delegate all other ILogger methods to the underlying logger
  table(
    dataOrLevel: LogLevel | Record<string, unknown>[] | Record<string, unknown>,
    dataOrOptions?: Record<string, unknown>[] | { headers?: string[]; border?: boolean },
    options?: { headers?: string[]; border?: boolean }
  ): void {
    this.logger.table(dataOrLevel, dataOrOptions, options);
  }

  setLevel(level: LogLevel | LogLevelString): void {
    this.logger.setLevel(level);
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.logger.setConfig(config);
  }

  getConfig(): LoggerConfig {
    return this.logger.getConfig();
  }

  isEnabled(level: LogLevel): boolean {
    return this.logger.isEnabled(level);
  }

  child(prefix: string): ILogger {
    return this.logger.child(prefix);
  }

  setHandler(handler: LogHandler | null): void {
    this.logger.setHandler(handler);
  }

  getHandler(): LogHandler | null {
    return this.logger.getHandler();
  }
}

// Create default logger instance
const defaultLogger = new EnhancedLogger();

// Export the default logger instance
export const logger = defaultLogger;

// Export utility functions for creating loggers
export function createLogger(config?: LoggerConfig): EnhancedLogger {
  return new EnhancedLogger(config);
}

// Export the default logger as the main export
export default logger;
