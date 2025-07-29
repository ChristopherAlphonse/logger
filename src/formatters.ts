/**
 * Log Formatters with Chalk Integration
 * Provides beautiful colored output for different log levels and contexts
 */

import chalk from 'chalk';
import {
  type ILogFormatter,
  type LogEntry,
  type LoggerConfig,
  LogLevel,
  type ChalkColor,
} from './types';

/**
 * Strategy Pattern - Base Formatter Strategy
 */
export abstract class BaseLogFormatter implements ILogFormatter {
  protected levelNames: Record<LogLevel, string>;
  protected levelTagColors: Record<LogLevel, ChalkColor>;
  protected messageColors: Record<LogLevel, ChalkColor>;

  constructor() {
    this.levelNames = {
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.TRACE]: 'TRACE',
      [LogLevel.Log]: 'LOG',
    };

    this.levelTagColors = {
      [LogLevel.ERROR]: chalk.red.bold,
      [LogLevel.WARN]: chalk.yellow.bold,
      [LogLevel.INFO]: chalk.green.bold,
      [LogLevel.DEBUG]: chalk.blue.bold,
      [LogLevel.TRACE]: chalk.magenta.bold,
      [LogLevel.Log]: chalk.cyan.bold,
    };

    this.messageColors = {
      [LogLevel.ERROR]: chalk.red,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.INFO]: chalk.white,
      [LogLevel.DEBUG]: chalk.blue,
      [LogLevel.TRACE]: chalk.magenta,
      [LogLevel.Log]: chalk.cyan,
    };
  }

  abstract formatLogEntry(entry: LogEntry, config: LoggerConfig): string;
  abstract formatJson(entry: LogEntry): string;
  abstract formatText(entry: LogEntry, config: LoggerConfig): string;
  abstract formatTable(
    entry: LogEntry,
    data: Record<string, unknown>[],
    config: LoggerConfig,
    options: { headers?: string[]; border?: boolean }
  ): string[];
}

/**
 * Strategy Pattern - Colored Text Formatter Strategy
 */
export class ColoredTextFormatter extends BaseLogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
    return this.formatText(entry, config);
  }

  formatJson(entry: LogEntry): string {
    return (
      JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: this.levelNames[entry.level],
        message: entry.message,
        data: entry.data,
        prefix: entry.prefix,
        source: entry.source,
      }) + '\n'
    );
  }

  formatText(entry: LogEntry, config: LoggerConfig): string {
    let output = '';

    // Add timestamp
    if (config.timestamps) {
      output += this.addTimestamp(entry.timestamp, config);
    }

    // Add prefix
    if (entry.prefix) {
      output += this.addPrefix(entry.prefix);
    }

    // Add level tag
    output += this.addLevelTag(entry.level);

    // Add message
    output += this.addMessage(entry.message, entry.level);

    // Add data
    if (entry.data) {
      output += this.addData(entry.data);
    }

    // Add source
    if (entry.source && config.showSource) {
      output += this.addSource(entry.source);
    }

    return output + '\n';
  }

  formatTable(
    entry: LogEntry,
    data: Record<string, unknown>[],
    config: LoggerConfig,
    options: { headers?: string[]; border?: boolean }
  ): string[] {
    const lines: string[] = [];

    // Add log entry header if there's a message (but without the data)
    if (entry.message) {
      const entryWithoutData = { ...entry, data: undefined };
      lines.push(this.formatText(entryWithoutData, config).trim());
    }

    if (data.length > 0) {
      const headers = options.headers || Object.keys(data[0]);
      const maxWidths = this.calculateColumnWidths(data, headers);

      // Calculate total width for border
      const totalWidth =
        headers.reduce(
          (sum, header) => sum + (maxWidths[header] || header.length),
          0
        ) +
        (headers.length - 1) * 3 +
        4;

      // Top border
      lines.push(chalk.blue('┌' + '─'.repeat(totalWidth - 2) + '┐'));

      // Header row with colored borders
      const headerCells = headers
        .map(header =>
          chalk.bold.blue(header.padEnd(maxWidths[header] || header.length))
        )
        .join(chalk.blue(' │ '));
      lines.push(chalk.blue('│ ') + headerCells + chalk.blue(' │'));

      // Header separator
      const separatorCells = headers
        .map(header => '─'.repeat(maxWidths[header] || header.length))
        .join(chalk.blue('─┼─'));
      lines.push(chalk.blue('├─') + separatorCells + chalk.blue('─┤'));

      // Data rows with colored borders
      data.forEach((row, index) => {
        const rowCells = headers
          .map(header => {
            const value = row[header];
            let displayValue = '';

            if (value === null || value === undefined) {
              displayValue = chalk.gray('null'); // Standardize to null
            } else if (typeof value === 'string') {
              displayValue = value;
            } else if (typeof value === 'number') {
              displayValue = chalk.cyan(value.toString());
            } else if (typeof value === 'boolean') {
              displayValue = value ? chalk.green('true') : chalk.red('false');
            } else if (typeof value === 'object') {
              // Truncate long JSON objects to prevent wrapping
              const jsonStr = JSON.stringify(value);
              const truncatedStr =
                jsonStr.length > 30
                  ? jsonStr.substring(0, 10) + '...'
                  : jsonStr;
              displayValue = chalk.yellow(truncatedStr);
            } else {
              displayValue = String(value);
            }

            return this.padDisplay(
              displayValue,
              maxWidths[header] || header.length
            );
          })
          .join(chalk.blue(' │ '));

        lines.push(chalk.blue('│ ') + rowCells + chalk.blue(' │'));
      });

      // Bottom border
      lines.push(chalk.blue('└' + '─'.repeat(totalWidth - 2) + '┘'));
    }

    return lines;
  }

  private addTimestamp(timestamp: Date, config: LoggerConfig): string {
    const timeStr = timestamp.toLocaleTimeString();
    return chalk.gray(`[${timeStr}]`);
  }

  private addPrefix(prefix: string | string[]): string {
    let contexts: string[];

    if (Array.isArray(prefix)) {
      // Use all contexts from array
      contexts = prefix;
    } else if (typeof prefix === 'string') {
      // Handle different string formats
      let cleanPrefix = prefix.replace(/[\[\]]/g, ''); // Remove brackets

      // If it's already space/underscore separated, split normally
      if (/[\s_]/.test(cleanPrefix)) {
        contexts = cleanPrefix
          .split(/[\s_]+/)
          .filter(context => context.length > 0)
          .map(context => context.toUpperCase());
      } else {
        // For concatenated strings like "MONITORINGHEALTHMETRICS"
        // Manually split on common context boundaries
        const knownContexts = [
          'MONITORING',
          'HEALTH',
          'METRICS',
          'SYSTEM',
          'API',
          'DATABASE',
          'AUTH',
          'SECURITY',
          'FILE',
          'NETWORK',
          'CACHE',
          'QUEUE',
          'VALIDATION',
          'PERFORMANCE',
          'ALERTING',
          'PROFILING',
          'BENCHMARK',
          'STARTUP',
          'SHUTDOWN',
          'RELOAD',
          'HOT_RELOAD',
          'MIGRATION',
          'SEED',
          'BACKUP',
          'RESTORE',
          'UPLOAD',
          'DOWNLOAD',
          'EXPORT',
          'IMPORT',
          'READ',
          'WRITE',
          'WEBSOCKET',
          'GRAPHQL',
          'REST',
          'HTTP',
          'REQUEST',
          'RESPONSE',
          'JWT',
          'OAUTH',
          'PERMISSION',
          'LOGIN',
          'LOGOUT',
          'RATE_LIMIT',
          'CORS',
          'HELMET',
          'POSTGRES',
          'MYSQL',
          'MONGODB',
          'REDIS',
          'ELASTICSEARCH',
          'AWS',
          'GOOGLE',
          'STRIPE',
          'TWILIO',
          'SENDGRID',
          'PAYMENT',
          'EMAIL',
          'NOTIFICATION',
          'KAFKA',
          'RABBITMQ',
          'SCHEDULER',
          'COMPRESSION',
          'STATIC',
        ];

        // Try to find known contexts in the string
        const foundContexts: string[] = [];
        let remaining = cleanPrefix.toUpperCase();

        for (const context of knownContexts) {
          if (remaining.includes(context)) {
            foundContexts.push(context);
            remaining = remaining.replace(context, '');
          }
        }

        // If we found contexts, use them; otherwise use the original string
        contexts = foundContexts.length > 0 ? foundContexts : [cleanPrefix];
      }
    } else {
      contexts = [String(prefix)];
    }

    const joinedContext = contexts.join('\u00A0');
    return joinedContext ? ' ' + this.getContextColor(joinedContext) + '' : ' ';
  }

  private getContextColor(context: string): string {
    // Define color mappings based on context type
    const colorMap: Record<string, (text: string) => string> = {
      // Database & Storage (Green)
      DATABASE: chalk.bgGreen.black,
      POSTGRES: chalk.bgGreen.black,
      MYSQL: chalk.bgGreen.black,
      MONGODB: chalk.bgGreen.black,
      REDIS: chalk.bgGreen.black,
      ELASTICSEARCH: chalk.bgGreen.black,
      CACHE: chalk.bgGreen.black,
      MIGRATION: chalk.bgGreen.black,
      SEED: chalk.bgGreen.black,
      BACKUP: chalk.bgGreen.black,
      RESTORE: chalk.bgGreen.black,

      // API & Network (Blue)
      API: chalk.bgBlue.white,
      NETWORK: chalk.bgBlue.white,
      WEBSOCKET: chalk.bgBlue.white,
      GRAPHQL: chalk.bgBlue.white,
      REST: chalk.bgBlue.white,
      HTTP: chalk.bgBlue.white,
      REQUEST: chalk.bgBlue.white,
      RESPONSE: chalk.bgBlue.white,

      // Authentication & Security (Yellow)
      AUTH: chalk.bgYellow.black,
      SECURITY: chalk.bgYellow.black,
      JWT: chalk.bgYellow.black,
      OAUTH: chalk.bgYellow.black,
      PERMISSION: chalk.bgYellow.black,
      LOGIN: chalk.bgYellow.black,
      LOGOUT: chalk.bgYellow.black,
      RATE_LIMIT: chalk.bgYellow.black,
      CORS: chalk.bgYellow.black,
      HELMET: chalk.bgYellow.black,

      // File Operations (Magenta)
      FILE: chalk.bgMagenta.white,
      UPLOAD: chalk.bgMagenta.white,
      DOWNLOAD: chalk.bgMagenta.white,
      EXPORT: chalk.bgMagenta.white,
      IMPORT: chalk.bgMagenta.white,
      READ: chalk.bgMagenta.white,
      WRITE: chalk.bgMagenta.white,

      // System & Monitoring (Cyan)
      SYSTEM: chalk.bgCyan.black,
      MONITORING: chalk.bgCyan.black,
      HEALTH: chalk.bgCyan.black,
      METRICS: chalk.bgCyan.black,
      ALERTING: chalk.bgCyan.black,
      PERFORMANCE: chalk.bgCyan.black,
      PROFILING: chalk.bgCyan.black,
      BENCHMARK: chalk.bgCyan.black,
      STARTUP: chalk.bgCyan.black,
      SHUTDOWN: chalk.bgCyan.black,
      RELOAD: chalk.bgCyan.black,
      HOT_RELOAD: chalk.bgCyan.black,

      // External Services (Red)
      AWS: chalk.bgRed.white,
      GOOGLE: chalk.bgRed.white,
      STRIPE: chalk.bgRed.white,
      TWILIO: chalk.bgRed.white,
      SENDGRID: chalk.bgRed.white,
      PAYMENT: chalk.bgRed.white,
      EMAIL: chalk.bgRed.white,
      NOTIFICATION: chalk.bgRed.white,

      // Development & Testing (Gray)
      DEBUG: chalk.bgGray.white,
      TRACE: chalk.bgGray.white,
      VERBOSE: chalk.bgGray.white,
      TEST: chalk.bgGray.white,
      E2E: chalk.bgGray.white,
      UNIT: chalk.bgGray.white,
      INTEGRATION: chalk.bgGray.white,

      // Queue & Messaging (Bright Magenta)
      QUEUE: chalk.bgMagenta.white,
      KAFKA: chalk.bgMagenta.white,
      RABBITMQ: chalk.bgMagenta.white,
      SCHEDULER: chalk.bgMagenta.white,

      // Validation & Processing (Bright Yellow)
      VALIDATION: chalk.bgYellow.black,
      COMPRESSION: chalk.bgYellow.black,
      STATIC: chalk.bgYellow.black,
    };

    // Get the color function for this context, or default to green
    const colorFn = colorMap[context] || chalk.bgGreen.black;
    return colorFn(` ${context} `);
  }

  private addLevelTag(level: LogLevel): string {
    const levelName = this.levelNames[level];
    const colorFn = this.levelTagColors[level];
    return ` [${colorFn(levelName)}]`;
  }

  private addMessage(message: string, level: LogLevel): string {
    const colorFn = this.messageColors[level];
    return ` ${colorFn(message)}`;
  }

  private addData(data: unknown): string {
    const dataStr =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return chalk.gray(` ${dataStr}`);
  }

  private addSource(source: string): string {
    return chalk.gray(` (${source})`);
  }

  private calculateColumnWidths(
    data: Record<string, unknown>[],
    headers: string[]
  ): Record<string, number> {
    const widths: Record<string, number> = {};

    headers.forEach(header => {
      widths[header] = header.length;
    });

    data.forEach(row => {
      headers.forEach(header => {
        const value = row[header];
        let displayValue = '';

        if (value === null || value === undefined) {
          displayValue = 'null'; // Standardize to null
        } else if (typeof value === 'object') {
          // Truncate long JSON objects to prevent wrapping
          const jsonStr = JSON.stringify(value);
          displayValue =
            jsonStr.length > 30 ? jsonStr.substring(0, 27) + '...' : jsonStr;
        } else {
          displayValue = String(value);
        }

        // For ColoredTextFormatter, we need to account for ANSI color codes
        // by stripping them for width calculation
        const strippedValue = this.stripAnsi(displayValue);
        widths[header] = Math.max(widths[header] || 0, strippedValue.length);
      });
    });

    return widths;
  }

  private stripAnsi(str: string): string {
    // Remove ANSI escape codes for width calculation
    return str.replace(/\u001b\[\d+m/g, '');
  }

  private padDisplay(str: string, targetWidth: number): string {
    const strippedLength = this.stripAnsi(str).length;
    const padding = targetWidth - strippedLength;
    return str + ' '.repeat(Math.max(0, padding));
  }
}

/**
 * Strategy Pattern - JSON Formatter Strategy
 */
export class JsonFormatter extends BaseLogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
    return this.formatJson(entry);
  }

  formatJson(entry: LogEntry): string {
    return (
      JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: this.levelNames[entry.level],
        message: entry.message,
        data: entry.data,
        prefix: entry.prefix,
        source: entry.source,
      }) + '\n'
    );
  }

  formatText(entry: LogEntry, config: LoggerConfig): string {
    return this.formatJson(entry);
  }

  formatTable(
    entry: LogEntry,
    data: Record<string, unknown>[],
    config: LoggerConfig,
    options: { headers?: string[]; border?: boolean }
  ): string[] {
    return [this.formatJson(entry)];
  }
}

/**
 * Strategy Pattern - Plain Text Formatter Strategy (no colors)
 */
export class PlainTextFormatter extends BaseLogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
    return this.formatText(entry, config);
  }

  formatJson(entry: LogEntry): string {
    return (
      JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: this.levelNames[entry.level],
        message: entry.message,
        data: entry.data,
        prefix: entry.prefix,
        source: entry.source,
      }) + '\n'
    );
  }

  formatText(entry: LogEntry, config: LoggerConfig): string {
    let output = '';

    if (config.timestamps) {
      output += `[${entry.timestamp.toLocaleTimeString()}]`;
    }

    if (entry.prefix) {
      output += ` [${entry.prefix}]`;
    }

    output += ` [${this.levelNames[entry.level]}]`;
    output += ` ${entry.message}`;

    if (entry.data) {
      const dataStr =
        typeof entry.data === 'string'
          ? entry.data
          : JSON.stringify(entry.data);
      output += ` ${dataStr}`;
    }

    if (entry.source && config.showSource) {
      output += ` (${entry.source})`;
    }

    return output + '\n';
  }

  formatTable(
    entry: LogEntry,
    data: Record<string, unknown>[],
    config: LoggerConfig,
    options: { headers?: string[]; border?: boolean }
  ): string[] {
    const lines: string[] = [];

    if (entry.message) {
      const entryWithoutData = { ...entry, data: undefined };
      lines.push(this.formatText(entryWithoutData, config).trim());
    }

    if (data.length > 0) {
      const headers = options.headers || Object.keys(data[0]);
      const maxWidths = this.calculateColumnWidths(data, headers);

      // Calculate total width for border
      const totalWidth =
        headers.reduce(
          (sum, header) => sum + (maxWidths[header] || header.length),
          0
        ) +
        (headers.length - 1) * 3 +
        4;

      // Top border
      lines.push('┌' + '─'.repeat(totalWidth - 2) + '┐');

      // Header row with borders
      const headerCells = headers
        .map(header => header.padEnd(maxWidths[header] || header.length))
        .join(' │ ');
      lines.push('│ ' + headerCells + ' │');

      // Header separator
      const separatorCells = headers
        .map(header => '─'.repeat(maxWidths[header] || header.length))
        .join('─┼─');
      lines.push('├─' + separatorCells + '─┤');

      // Data rows with borders
      data.forEach(row => {
        const rowCells = headers
          .map(header => {
            const value = row[header];
            let displayValue = '';

            if (value === null || value === undefined) {
              displayValue = 'null'; // Standardize to null
            } else if (typeof value === 'object') {
              // Truncate long JSON objects to prevent wrapping
              const jsonStr = JSON.stringify(value);
              displayValue =
                jsonStr.length > 30
                  ? jsonStr.substring(0, 27) + '...'
                  : jsonStr;
            } else {
              displayValue = String(value);
            }

            return this.padDisplay(displayValue, maxWidths[header]);
          })
          .join(' │ ');

        lines.push('│ ' + rowCells + ' │');
      });

      // Bottom border
      lines.push('└' + '─'.repeat(totalWidth - 2) + '┘');
    }

    return lines;
  }

  private stripAnsi(str: string): string {
    return str.replace(/\u001b\[.*?m/g, '');
  }

  private padDisplay(str: string, targetWidth: number): string {
    const visibleLength = this.stripAnsi(str).length;
    const padding = targetWidth - visibleLength;
    return str + ' '.repeat(Math.max(0, padding));
  }

  private calculateColumnWidths(
    data: Record<string, unknown>[],
    headers: string[]
  ): Record<string, number> {
    const widths: Record<string, number> = {};

    headers.forEach(header => {
      widths[header] = header.length;
    });

    data.forEach(row => {
      headers.forEach(header => {
        const value = row[header];
        let displayValue = '';

        if (value === null || value === undefined) {
          displayValue = 'null'; // Standardize to null
        } else if (typeof value === 'object') {
          // Truncate long JSON objects to prevent wrapping
          const jsonStr = JSON.stringify(value);
          displayValue =
            jsonStr.length > 30 ? jsonStr.substring(0, 27) + '...' : jsonStr;
        } else {
          displayValue = String(value);
        }

        widths[header] = Math.max(
          widths[header],
          this.stripAnsi(displayValue).length
        );
      });
    });

    return widths;
  }
}

/**
 * Default Log Formatter - Uses ColoredTextFormatter by default
 */
export class LogFormatter extends ColoredTextFormatter {
  // Inherits all functionality from ColoredTextFormatter
}
