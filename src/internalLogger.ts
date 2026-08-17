import { createDefaultOutput } from './output-policy';

class SimpleInternalLogger {
  constructor(private prefix: string) {}

  warn(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    const stream =
      typeof process !== 'undefined' && process.stderr
        ? process.stderr
        : createDefaultOutput('localhost');
    stream.write(output);
  }

  error(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    const stream =
      typeof process !== 'undefined' && process.stderr
        ? process.stderr
        : createDefaultOutput('localhost');
    stream.write(output);
  }

  info(message: string, data?: unknown): void {
    const output = data
      ? `${this.prefix} ${message} ${JSON.stringify(data)}\n`
      : `${this.prefix} ${message}\n`;

    createDefaultOutput('localhost').write(output);
  }
}

export const createInternalLogger = (prefix = '[INTERNAL]') => new SimpleInternalLogger(prefix);
