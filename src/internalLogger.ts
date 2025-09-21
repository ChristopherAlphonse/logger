import { LogLevel } from './types';

/**
 * Simple internal logger to avoid circular dependencies.
 * Uses direct stderr/stdout writes instead of console to maintain consistency.
 */
class SimpleInternalLogger {
  constructor(private prefix: string) {}

  warn(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(output);
    } else {
      console.warn(output.trim());
    }
  }

  error(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(output);
    } else {
      console.error(output.trim());
    }
  }

  info(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(output);
    } else {
      console.log(output.trim());
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
