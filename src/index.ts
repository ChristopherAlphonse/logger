export { Logger } from './logger';
export { LogLevel } from './types';
export type { LoggerConfig, LogEntry, ILogger, LogData } from './types';
export { LoggerFactory } from './factories';
export { LogFormatter } from './formatters';
export * from './constants';

import { LoggerFactory } from './factories';
import { Logger } from './logger';
import { LogLevel } from './types';
import type { LogData, LoggerConfig } from './types';

const defaultLogger = new Logger();

const log = {
  error: (message: string, data?: LogData) => defaultLogger.error(message, data),

  warn: (message: string, data?: LogData) => defaultLogger.warn(message, data),

  info: (message: string, data?: LogData) => defaultLogger.info(message, data),

  debug: (message: string, data?: LogData) => defaultLogger.debug(message, data),

  trace: (message: string, data?: LogData) => defaultLogger.trace(message, data),
};

const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);

const createChildLogger = (prefix: string) => defaultLogger.child(prefix);

const setLogLevel = (level: LogLevel) => defaultLogger.setLevel(level);

const configureLogger = (config: Partial<LoggerConfig>) => defaultLogger.setConfig(config);

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

export default mainLogger;
