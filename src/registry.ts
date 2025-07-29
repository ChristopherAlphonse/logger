/**
 * Global logger registry for centralized control
 */

import { type ILogger, type LogHandler, LogLevel, type LogLevelString } from './types';
import { stringToLogLevel } from './types';

/**
 * Logger identifier interface for registry tracking
 */
interface LoggerIdentifier {
  logger: ILogger;
  name: string;
  id: string;
}

/**
 * Global logger registry
 */
class LoggerRegistry {
  private _instances: LoggerIdentifier[] = [];
  private _globalHandler: LogHandler | null = null;
  private _globalLevel: LogLevel = LogLevel.INFO;

  get instances(): ILogger[] {
    return this._instances.map((identifier) => identifier.logger);
  }

  register(logger: ILogger, name?: string): void {
    const id = this.generateId();
    const loggerName = name || this.getLoggerName(logger);

    this._instances.push({
      logger,
      name: loggerName,
      id,
    });
  }

  unregister(logger: ILogger): void {
    const index = this._instances.findIndex((identifier) => identifier.logger === logger);
    if (index > -1) {
      this._instances.splice(index, 1);
    }
  }

  setGlobalLevel(level: LogLevelString | LogLevel): void {
    this._globalLevel = typeof level === 'string' ? stringToLogLevel(level) : level;
    for (const identifier of this._instances) {
      if (identifier.logger.setLevel) {
        identifier.logger.setLevel(this._globalLevel);
      }
    }
  }

  setGlobalHandler(handler: LogHandler | null): void {
    this._globalHandler = handler;
    for (const identifier of this._instances) {
      if (identifier.logger.setHandler) {
        identifier.logger.setHandler(handler);
      }
    }
  }

  getInstance(name: string): ILogger | undefined {
    const identifier = this._instances.find((instance) => instance.name === name);
    return identifier?.logger;
  }

  getAllInstances(): ILogger[] {
    return this._instances.map((identifier) => identifier.logger);
  }

  getGlobalLevel(): LogLevel {
    return this._globalLevel;
  }

  getGlobalHandler(): LogHandler | null {
    return this._globalHandler;
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  private getLoggerName(logger: ILogger): string {
    const config = logger.getConfig();
    return config.prefix || 'default';
  }
}

/**
 * Global registry instance
 */
export const loggerRegistry = new LoggerRegistry();
