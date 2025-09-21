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
      console.info(output.trim());
    }
  }
}

export const createInternalLogger = (prefix = '[INTERNAL]') => new SimpleInternalLogger(prefix);
