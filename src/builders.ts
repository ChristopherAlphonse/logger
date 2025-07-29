/**
 * Builder Pattern - Logger Builder Implementation
 * Provides fluent interface for configuring loggers
 */

import { Logger } from './logger';
import {
  type ILogger,
  type ILoggerBuilder,
  type LogHandler,
  type LogLevel,
  LogLevel as LogLevelEnum,
  type LogLevelString,
  type LoggerConfig,
  stringToLogLevel,
} from './types';

/**
 * Logger Builder Implementation
 */
export class LoggerBuilder implements ILoggerBuilder {
  private config: Partial<LoggerConfig> = {};

  setLevel(level: LogLevel | LogLevelString): ILoggerBuilder {
    this.config.level =
      typeof level === 'string' ? stringToLogLevel(level) : level;
    return this;
  }

  setTimestamps(enabled: boolean): ILoggerBuilder {
    this.config.timestamps = enabled;
    return this;
  }

  setColors(enabled: boolean): ILoggerBuilder {
    this.config.colors = enabled;
    return this;
  }

  setTimestampFormat(format: string): ILoggerBuilder {
    this.config.timestampFormat = format;
    return this;
  }

  setShowSource(enabled: boolean): ILoggerBuilder {
    this.config.showSource = enabled;
    return this;
  }

  setPrefix(prefix: string): ILoggerBuilder {
    this.config.prefix = prefix;
    return this;
  }

  setJson(enabled: boolean): ILoggerBuilder {
    this.config.json = enabled;
    return this;
  }

  setOutput(output: NodeJS.WritableStream): ILoggerBuilder {
    this.config.output = output;
    return this;
  }

  setHandler(handler: LogHandler | null): ILoggerBuilder {
    this.config.handler = handler;
    return this;
  }

  build(): ILogger {
    return new Logger(this.config);
  }

  /**
   * Reset the builder to default state
   */
  reset(): ILoggerBuilder {
    this.config = {};
    return this;
  }

  /**
   * Build a JSON logger with common production settings
   */
  buildJsonLogger(): ILogger {
    return this.setJson(true)
      .setColors(false)
      .setTimestamps(true)
      .setShowSource(false)
      .build();
  }

  /**
   * Build a minimal logger with basic settings
   */
  buildMinimalLogger(): ILogger {
    return this.setTimestamps(false)
      .setColors(false)
      .setShowSource(false)
      .setJson(false)
      .build();
  }

  /**
   * Build a verbose logger with all features enabled
   */
  buildVerboseLogger(): ILogger {
    return this.setLevel(LogLevelEnum.TRACE)
      .setTimestamps(true)
      .setColors(true)
      .setShowSource(true)
      .setJson(false)
      .build();
  }

  /**
   * Build a development logger with colored output
   */
  buildDevelopmentLogger(): ILogger {
    return this.setLevel(LogLevelEnum.DEBUG)
      .setTimestamps(true)
      .setColors(true)
      .setShowSource(true)
      .setJson(false)
      .build();
  }

  /**
   * Build a production logger with JSON output
   */
  buildProductionLogger(): ILogger {
    return this.setLevel(LogLevelEnum.WARN)
      .setJson(true)
      .setColors(false)
      .setTimestamps(true)
      .setShowSource(false)
      .build();
  }
}
