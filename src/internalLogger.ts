import { LogLevel } from './types';

/**
 * Simple internal logger to avoid circular dependencies.
 * Uses console with prefixes for internal logging only.
 */
class SimpleInternalLogger {
  constructor(private prefix: string) {}

  warn(message: string, data?: unknown): void {
    if (data) {
      console.warn(`${this.prefix} ${message}`, data);
    } else {
      console.warn(`${this.prefix} ${message}`);
    }
  }

  error(message: string, data?: unknown): void {
    if (data) {
      console.error(`${this.prefix} ${message}`, data);
    } else {
      console.error(`${this.prefix} ${message}`);
    }
  }

  info(message: string, data?: unknown): void {
    if (data) {
      console.info(`${this.prefix} ${message}`, data);
    } else {
      console.info(`${this.prefix} ${message}`);
    }
  }
}

/**
 * Creates a simple internal logger that avoids circular dependencies.
 *
 * @param prefix - Optional prefix for the logger. Defaults to '[INTERNAL]'.
 * @returns A simple logger instance for internal use.
 *
 * @example
 * const internalLogger = createInternalLogger('[CONFIG]');
 * internalLogger.warn('This is a warning');
 */
export const createInternalLogger = (prefix: string = '[INTERNAL]') =>
  new SimpleInternalLogger(prefix);
