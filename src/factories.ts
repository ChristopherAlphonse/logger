/**
 * Abstract Factory Pattern - Logger Factory Implementation
 * Creates different types of loggers with specific configurations
 */

import { LoggerBuilder } from './builders';
import { Logger } from './logger';
import {
  type ILogger,
  type ILoggerFactory,
  LogLevel,
  type LoggerConfig,
} from './types';

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

/**
 * Concrete Factory - Builder-based Logger Factory
 */
export class BuilderLoggerFactory extends AbstractLoggerFactory {
  private readonly builder: LoggerBuilder;

  constructor(builder: LoggerBuilder = new LoggerBuilder()) {
    super();
    this.builder = builder;
  }

  createLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return this.builder.reset().build();
  }

  createJsonLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return this.builder.reset().buildJsonLogger();
  }
}

/**
 * Concrete Factory - Environment-specific Logger Factory
 */
export class EnvironmentLoggerFactory extends AbstractLoggerFactory {
  private readonly environment: string;

  constructor(environment = 'development') {
    super();
    this.environment = environment;
  }

  createLogger(config: Partial<LoggerConfig> = {}): ILogger {
    switch (this.environment) {
      case 'production':
        return this.createProductionLogger(config);
      case 'test':
        return this.createTestLogger(config);
      case 'ci':
        return this.createCILogger(config);
      default:
        return this.createDevelopmentLogger(config);
    }
  }

  createJsonLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({ ...config, json: true, colors: false });
  }

  private createDevelopmentLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      level: LogLevel.DEBUG,
      timestamps: true,
      colors: true,
      showSource: true,
      json: false,
      ...config,
    });
  }

  private createProductionLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      level: LogLevel.WARN,
      timestamps: true,
      colors: false,
      showSource: false,
      json: true,
      ...config,
    });
  }

  private createTestLogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      level: LogLevel.TRACE,
      timestamps: false,
      colors: false,
      showSource: false,
      json: false,
      ...config,
    });
  }

  private createCILogger(config: Partial<LoggerConfig> = {}): ILogger {
    return new Logger({
      level: LogLevel.INFO,
      timestamps: true,
      colors: false,
      showSource: false,
      json: true,
      ...config,
    });
  }
}

/**
 * Factory Registry for managing different factory types
 */
export class LoggerFactoryRegistry {
  private readonly factories: Map<string, AbstractLoggerFactory> = new Map();

  constructor() {
    this.registerDefaultFactories();
  }

  register(name: string, factory: AbstractLoggerFactory): void {
    this.factories.set(name, factory);
  }

  private registerDefaultFactories(): void {
    this.register('standard', new StandardLoggerFactory());
    this.register('builder', new BuilderLoggerFactory());
    this.register(
      'env-development',
      new EnvironmentLoggerFactory('development')
    );
    this.register('env-production', new EnvironmentLoggerFactory('production'));
    this.register('env-test', new EnvironmentLoggerFactory('test'));
    this.register('env-ci', new EnvironmentLoggerFactory('ci'));
  }
}
