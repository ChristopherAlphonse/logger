import { Logger } from './logger';
import { LogLevel, type LoggerConfig } from './types';

export const LoggerFactory = {
  createJsonLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({ ...config, json: true, colors: false });
  },

  createMinimalLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      timestamps: false,
      colors: false,
      showSource: false,
    });
  },

  createVerboseLogger(config: Partial<LoggerConfig> = {}): Logger {
    return new Logger({
      ...config,
      level: LogLevel.TRACE,
      timestamps: true,
      colors: true,
      showSource: true,
    });
  },
};
