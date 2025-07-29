/**
 * Abstract Factory Pattern - Logger Factory Implementation
 * Creates different types of loggers with specific configurations
 */

import { Logger } from './logger';
import { type ILogger, type ILoggerFactory, LogLevel, type LoggerConfig } from './types';

/**
 * Abstract Factory - Base Logger Factory
 */
export abstract class AbstractLoggerFactory implements ILoggerFactory {
  abstract createLogger(config?: Partial<LoggerConfig>): ILogger;
  abstract createJsonLogger(config?: Partial<LoggerConfig>): ILogger;

  createMinimalLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      ...config,
      timestamps: false,
      colors: false,
      showSource: false,
    });
  }

  createVerboseLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      ...config,
      level: LogLevel.TRACE,
      timestamps: true,
      colors: true,
      showSource: true,
    });
  }
}

/**
 * Concrete Factory - Standard Logger Factory
 */
export class StandardLoggerFactory extends AbstractLoggerFactory {
  createLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger(config);
  }

  createJsonLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({ ...config, json: true, colors: false });
  }
}
