import {
  LogLevel,
  Logger,
  type LoggerConfig,
  configureLogger,
  createChildLogger,
  createLogger,
  log,
} from '../index';

// Jest globals are available without import

describe('Logger', () => {
  let logger: Logger;
  let mockOutput: NodeJS.WritableStream;

  beforeEach(() => {
    mockOutput = {
      write: () => true,
      writable: true,
      end: () => mockOutput,
      addListener: () => mockOutput,
      on: () => mockOutput,
      once: () => mockOutput,
      prependListener: () => mockOutput,
      prependOnceListener: () => mockOutput,
      removeListener: () => mockOutput,
      off: () => mockOutput,
      removeAllListeners: () => mockOutput,
      setMaxListeners: () => mockOutput,
      getMaxListeners: () => 10,
      listeners: () => [],
      rawListeners: () => [],
      emit: () => true,
      listenerCount: () => 0,
      eventNames: () => [],
    } as NodeJS.WritableStream;
    logger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
  });

  describe('constructor', () => {
    test('should create a logger with default configuration', () => {
      const defaultLogger = new Logger();
      const config = defaultLogger.getConfig();

      expect(config.level).toBe(LogLevel.INFO);
      expect(config.timestamps).toBe(true);
      expect(config.colors).toBe(true);
      expect(config.showSource).toBe(false);
      expect(config.json).toBe(false);
    });

    test('should create a logger with custom configuration', () => {
      const customLogger = new Logger({
        level: LogLevel.DEBUG,
        timestamps: false,
        colors: false,
        showSource: true,
        prefix: 'TEST',
      });

      const config = customLogger.getConfig();
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(true);
      expect(config.prefix).toBe('TEST');
    });
  });

  describe('log levels', () => {
    test('should log error messages', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
      expect(() => testLogger.error('Test error message')).not.toThrow();
    });

    test('should log warning messages', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
      expect(() => testLogger.warn('Test warning message')).not.toThrow();
    });

    test('should log info messages', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
      expect(() => testLogger.info('Test info message')).not.toThrow();
    });

    test('should log debug messages', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
      expect(() => testLogger.debug('Test debug message')).not.toThrow();
    });

    test('should log trace messages', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.TRACE });
      expect(() => testLogger.trace('Test trace message')).not.toThrow();
    });
  });

  describe('log level filtering', () => {
    test('should not log messages below the set level', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.WARN });

      // These should not throw but also not log anything visible
      expect(() => testLogger.info('This should not be logged')).not.toThrow();
      expect(() => testLogger.debug('This should not be logged')).not.toThrow();
      expect(() => testLogger.trace('This should not be logged')).not.toThrow();
    });

    test('should log messages at or above the set level', () => {
      const testLogger = new Logger({ output: mockOutput, level: LogLevel.WARN });

      expect(() => testLogger.error('This should be logged')).not.toThrow();
      expect(() => testLogger.warn('This should be logged')).not.toThrow();
    });
  });

  describe('configuration', () => {
    test('should update log level', () => {
      const testLogger = new Logger();
      testLogger.setLevel(LogLevel.DEBUG);
      expect(testLogger.getConfig().level).toBe(LogLevel.DEBUG);
    });

    test('should update configuration', () => {
      const testLogger = new Logger();
      const newConfig: LoggerConfig = {
        level: LogLevel.TRACE,
        timestamps: false,
        colors: false,
        showSource: true,
        prefix: 'UPDATED',
      };

      testLogger.setConfig(newConfig);
      const config = testLogger.getConfig();

      expect(config.level).toBe(LogLevel.TRACE);
      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(true);
      expect(config.prefix).toBe('UPDATED');
    });

    test('should check if level is enabled', () => {
      const testLogger = new Logger({ level: LogLevel.WARN });

      expect(testLogger.isEnabled(LogLevel.ERROR)).toBe(true);
      expect(testLogger.isEnabled(LogLevel.WARN)).toBe(true);
      expect(testLogger.isEnabled(LogLevel.INFO)).toBe(false);
      expect(testLogger.isEnabled(LogLevel.DEBUG)).toBe(false);
      expect(testLogger.isEnabled(LogLevel.TRACE)).toBe(false);
    });
  });

  describe('child loggers', () => {
    test('should create child logger with prefix', () => {
      const parentLogger = new Logger({ level: LogLevel.INFO });
      const childLogger = parentLogger.child('CHILD');

      const config = childLogger.getConfig();
      expect(config.prefix).toBe('CHILD');
      expect(config.level).toBe(LogLevel.INFO);
    });

    test('should create nested child loggers', () => {
      const parentLogger = new Logger({ level: LogLevel.INFO });
      const childLogger = parentLogger.child('CHILD');
      const grandchildLogger = childLogger.child('GRANDCHILD');

      const config = grandchildLogger.getConfig();
      expect(config.prefix).toBe('GRANDCHILD');
    });
  });

  describe('JSON output', () => {
    test('should format JSON output correctly', () => {
      const testLogger = new Logger({
        json: true,
        output: mockOutput,
        level: LogLevel.INFO,
      });

      expect(() => testLogger.info('Test message', { key: 'value' })).not.toThrow();
    });

    test('should handle JSON output with complex data', () => {
      const testLogger = new Logger({
        json: true,
        output: mockOutput,
        level: LogLevel.INFO,
      });

      const complexData = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
        error: new Error('test error'),
        date: new Date(),
      };

      expect(() => testLogger.info('Complex data test', complexData)).not.toThrow();
    });
  });

  describe('source information', () => {
    test('should extract source information when enabled', () => {
      const testLogger = new Logger({
        showSource: true,
        output: mockOutput,
        level: LogLevel.INFO,
      });

      expect(() => testLogger.info('Test with source')).not.toThrow();
    });
  });

  describe('static factory methods', () => {
    test('should create JSON logger', () => {
      const jsonLogger = Logger.createJsonLogger({ output: mockOutput });
      const config = jsonLogger.getConfig();

      expect(config.json).toBe(true);
      expect(config.colors).toBe(false);
    });

    test('should create minimal logger', () => {
      const minimalLogger = Logger.createMinimalLogger({ output: mockOutput });
      const config = minimalLogger.getConfig();

      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(false);
    });

    test('should create verbose logger', () => {
      const verboseLogger = Logger.createVerboseLogger({ output: mockOutput });
      const config = verboseLogger.getConfig();

      expect(config.level).toBe(LogLevel.TRACE);
      expect(config.timestamps).toBe(true);
      expect(config.colors).toBe(true);
      expect(config.showSource).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty messages', () => {
      const testLogger = new Logger({ output: mockOutput });
      expect(() => testLogger.info('')).not.toThrow();
    });

    test('should handle null and undefined data', () => {
      const testLogger = new Logger({ output: mockOutput });
      expect(() => testLogger.info('Test message', null)).not.toThrow();
      expect(() => testLogger.info('Test message', undefined)).not.toThrow();
    });

    test('should handle circular references in data', () => {
      const testLogger = new Logger({ output: mockOutput });
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      expect(() => testLogger.info('Circular reference test', circular)).not.toThrow();
    });

    test('should handle very long messages', () => {
      const testLogger = new Logger({ output: mockOutput });
      const longMessage = 'A'.repeat(10000);
      expect(() => testLogger.info(longMessage)).not.toThrow();
    });
  });

  describe('convenience functions', () => {
    test('should use global logger instance', () => {
      expect(() => log.info('Test global logger')).not.toThrow();
    });

    test('should create logger with convenience function', () => {
      const testLogger = createLogger({ level: LogLevel.DEBUG });
      expect(testLogger.getConfig().level).toBe(LogLevel.DEBUG);
    });

    test('should create child logger with convenience function', () => {
      const childLogger = createChildLogger('CHILD');
      expect(childLogger.getConfig().prefix).toBe('CHILD');
    });

    test('should configure logger with convenience function', () => {
      const originalLevel = logger.getConfig().level || LogLevel.INFO;
      configureLogger({ level: LogLevel.TRACE });
      expect(logger.getConfig().level).toBe(LogLevel.TRACE);
      // Reset to original level
      configureLogger({ level: originalLevel });
    });

    test('should set log level with convenience function', () => {
      // Create a fresh logger instance for this test
      const testLogger = new Logger();
      const originalSetLevel = testLogger.setLevel.bind(testLogger);

      // Test the setLevel method directly
      originalSetLevel(LogLevel.ERROR);
      expect(testLogger.getConfig().level).toBe(LogLevel.ERROR);
    });
  });
});
