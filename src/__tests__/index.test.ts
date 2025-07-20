import {
  LogLevel,
  Logger,
  configureLogger,
  createChildLogger,
  createLogger,
  log,
  logger,
  setLogLevel,
} from '../index';

// Jest globals are available without import

describe('Index exports', () => {
  describe('Logger class', () => {
    test('should export Logger class', () => {
      expect(Logger).toBeDefined();
      expect(typeof Logger).toBe('function');
    });

    test('should be able to create Logger instance', () => {
      const loggerInstance = new Logger();
      expect(loggerInstance).toBeInstanceOf(Logger);
    });
  });

  describe('LogLevel enum', () => {
    test('should export LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
      expect(LogLevel.TRACE).toBe(4);
    });
  });

  describe('Default logger instance', () => {
    test('should export default logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    test('should have all required methods', () => {
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.trace).toBe('function');
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.setLevel).toBe('function');
      expect(typeof logger.setConfig).toBe('function');
      expect(typeof logger.getConfig).toBe('function');
      expect(typeof logger.isEnabled).toBe('function');
      expect(typeof logger.child).toBe('function');
    });
  });

  describe('Convenience log functions', () => {
    test('should export convenience log functions', () => {
      expect(log).toBeDefined();
      expect(typeof log.error).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.debug).toBe('function');
      expect(typeof log.trace).toBe('function');
    });

    test('should call the default logger methods', () => {
      // Test that convenience functions don't throw
      expect(() => log.error('test error')).not.toThrow();
      expect(() => log.info('test info')).not.toThrow();
    });

    test('should call the default logger methods with data', () => {
      const testData = { key: 'value' };

      // Test that convenience functions with data don't throw
      expect(() => log.warn('test warning', testData)).not.toThrow();
      expect(() => log.debug('test debug', testData)).not.toThrow();
      expect(() => log.trace('test trace', testData)).not.toThrow();
    });
  });

  describe('Factory functions', () => {
    test('should export createLogger function', () => {
      expect(createLogger).toBeDefined();
      expect(typeof createLogger).toBe('function');
    });

    test('should create logger with configuration', () => {
      const customLogger = createLogger({ level: LogLevel.DEBUG });
      expect(customLogger).toBeInstanceOf(Logger);
      expect(customLogger.getConfig().level).toBe(LogLevel.DEBUG);
    });

    test('should export createChildLogger function', () => {
      expect(createChildLogger).toBeDefined();
      expect(typeof createChildLogger).toBe('function');
    });

    test('should create child logger with prefix', () => {
      const childLogger = createChildLogger('TEST');
      expect(childLogger).toBeInstanceOf(Logger);
      expect(childLogger.getConfig().prefix).toBe('TEST');
    });
  });

  describe('Utility functions', () => {
    test('should export setLogLevel function', () => {
      expect(setLogLevel).toBeDefined();
      expect(typeof setLogLevel).toBe('function');
    });

    test('should set global log level', () => {
      const originalLevel = logger.getConfig().level;
      setLogLevel(LogLevel.DEBUG);
      expect(logger.getConfig().level).toBe(LogLevel.DEBUG);
      // Restore original level
      if (originalLevel !== undefined) {
        setLogLevel(originalLevel);
      }
    });

    test('should export configureLogger function', () => {
      expect(configureLogger).toBeDefined();
      expect(typeof configureLogger).toBe('function');
    });

    test('should configure global logger', () => {
      const originalConfig = logger.getConfig();
      configureLogger({ prefix: 'TEST_CONFIG' });
      expect(logger.getConfig().prefix).toBe('TEST_CONFIG');
      // Restore original config
      configureLogger(originalConfig);
    });
  });

  describe('Type exports', () => {
    test('should export LoggerConfig type', () => {
      // TypeScript types are not available at runtime, so we just test that the module exports work
      expect(Logger).toBeDefined();
      expect(LogLevel).toBeDefined();
    });

    test('should export LogEntry type', () => {
      // TypeScript types are not available at runtime, so we just test that the module exports work
      expect(Logger).toBeDefined();
      expect(LogLevel).toBeDefined();
    });

    test('should export ILogger interface', () => {
      // TypeScript types are not available at runtime, so we just test that the module exports work
      expect(Logger).toBeDefined();
      expect(LogLevel).toBeDefined();
    });

    test('should export LogData type', () => {
      // TypeScript types are not available at runtime, so we just test that the module exports work
      expect(Logger).toBeDefined();
      expect(LogLevel).toBeDefined();
    });
  });

  describe('Default export', () => {
    test('should have default export', async () => {
      const module = await import('../index');
      expect(module.default).toBeDefined();
      expect(module.default).toBeInstanceOf(Logger);
    });
  });

  describe('Integration tests', () => {
    test('should work with all exports together', () => {
      // Test that all exports work together without conflicts
      const customLogger = createLogger({ level: LogLevel.DEBUG });
      const childLogger = createChildLogger('INTEGRATION');

      expect(customLogger).toBeInstanceOf(Logger);
      expect(childLogger).toBeInstanceOf(Logger);
      expect(customLogger.getConfig().level).toBe(LogLevel.DEBUG);
      expect(childLogger.getConfig().prefix).toBe('INTEGRATION');

      // Test convenience functions
      expect(() => log.info('Integration test')).not.toThrow();
    });
  });
});
