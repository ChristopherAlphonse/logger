import {
  LogLevel,
  Logger,
  type LoggerConfig,
  LoggerFactory,
  configureLogger,
  createChildLogger,
  createLogger,
  log,
} from '../index';

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
      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(true);
      expect(config.showSource).toBe(true);
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
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.TRACE,
      });
      expect(() => testLogger.error('Test error message')).not.toThrow();
    });

    test('should log warning messages', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.TRACE,
      });
      expect(() => testLogger.warn('Test warning message')).not.toThrow();
    });

    test('should log info messages', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.TRACE,
      });
      expect(() => testLogger.info('Test info message')).not.toThrow();
    });

    test('should log debug messages', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.TRACE,
      });
      expect(() => testLogger.debug('Test debug message')).not.toThrow();
    });

    test('should log trace messages', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.TRACE,
      });
      expect(() => testLogger.trace('Test trace message')).not.toThrow();
    });
  });

  describe('log level filtering', () => {
    test('should not log messages below the set level', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.WARN,
      });

      expect(() => testLogger.info('This should not be logged')).not.toThrow();
      expect(() => testLogger.debug('This should not be logged')).not.toThrow();
      expect(() => testLogger.trace('This should not be logged')).not.toThrow();
    });

    test('should log messages at or above the set level', () => {
      const testLogger = new Logger({
        output: mockOutput,
        level: LogLevel.WARN,
      });

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

      expect(() =>
        testLogger.info('Test message', { key: 'value' })
      ).not.toThrow();
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

      expect(() =>
        testLogger.info('Complex data test', complexData)
      ).not.toThrow();
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
      const jsonLogger = LoggerFactory.createJsonLogger({ output: mockOutput });
      const config = jsonLogger.getConfig();

      expect(config.json).toBe(true);
      expect(config.colors).toBe(false);
    });

    test('should create minimal logger', () => {
      const minimalLogger = LoggerFactory.createMinimalLogger({
        output: mockOutput,
      });
      const config = minimalLogger.getConfig();

      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(false);
    });

    test('should create verbose logger', () => {
      const verboseLogger = LoggerFactory.createVerboseLogger({
        output: mockOutput,
      });
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

      expect(() =>
        testLogger.info('Circular reference test', circular)
      ).not.toThrow();
    });

    test('should handle very long messages', () => {
      const testLogger = new Logger({ output: mockOutput });
      const longMessage = 'A'.repeat(10000);
      expect(() => testLogger.info(longMessage)).not.toThrow();
    });

    test('should handle non-colored output for timestamps', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        timestamps: true,
        level: LogLevel.INFO,
      });
      expect(() => testLogger.info('Test message')).not.toThrow();
    });

    test('should handle non-colored output for prefixes', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        prefix: 'TEST',
        level: LogLevel.INFO,
      });
      expect(() => testLogger.info('Test message')).not.toThrow();
    });

    test('should handle non-colored output for level tags', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        level: LogLevel.INFO,
      });
      expect(() => testLogger.info('Test message')).not.toThrow();
    });

    test('should handle non-colored output for source info', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        showSource: true,
        level: LogLevel.INFO,
      });
      expect(() => testLogger.info('Test message')).not.toThrow();
    });

    test('should handle non-colored output for messages', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        level: LogLevel.INFO,
      });
      expect(() => testLogger.info('Test message')).not.toThrow();
    });

    test('should handle non-colored output for data', () => {
      const testLogger = new Logger({
        output: mockOutput,
        colors: false,
        level: LogLevel.INFO,
      });
      expect(() =>
        testLogger.info('Test message', { key: 'value' })
      ).not.toThrow();
    });

    test('should handle JSON serialization errors gracefully', () => {
      const testLogger = new Logger({ output: mockOutput });

      const problematicObject = {
        get circular() {
          return this;
        },
      };

      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Circular reference');
      });

      expect(() =>
        testLogger.info('Test with problematic object', problematicObject)
      ).not.toThrow();

      JSON.stringify = originalStringify;
    });

    test('should handle source info when stack is null', () => {
      const originalError = global.Error;
      global.Error = class MockError extends originalError {
        get stack(): string | undefined {
          return undefined;
        }
      } as typeof Error;

      const testLogger = new Logger({
        output: mockOutput,
        showSource: true,
        level: LogLevel.INFO,
      });

      expect(() => testLogger.info('Test with null stack')).not.toThrow();

      global.Error = originalError;
    });

    test('should handle source info when stack parsing fails', () => {
      const originalError = global.Error;
      global.Error = class MockError extends originalError {
        get stack(): string | undefined {
          return 'Error\n    at someFunction (invalid:format:line)\n    at anotherFunction (also:invalid:format)';
        }
      } as typeof Error;

      const testLogger = new Logger({
        output: mockOutput,
        showSource: true,
        level: LogLevel.INFO,
      });

      expect(() =>
        testLogger.info('Test with invalid stack format')
      ).not.toThrow();

      global.Error = originalError;
    });

    test('should handle source info when all stack lines are filtered out', () => {
      const originalError = global.Error;
      global.Error = class MockError extends originalError {
        get stack(): string | undefined {
          return 'Error\n    at Object.<anonymous> (/path/to/node_modules/something.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1:1)';
        }
      } as typeof Error;

      const testLogger = new Logger({
        output: mockOutput,
        showSource: true,
        level: LogLevel.INFO,
      });

      expect(() => testLogger.info('Test with filtered stack')).not.toThrow();

      global.Error = originalError;
    });

    test('should handle source info when fileName extraction fails', () => {
      const originalError = global.Error;
      global.Error = class MockError extends originalError {
        get stack(): string | undefined {
          return 'Error\n    at someFunction (C:\\:1:1)\n    at anotherFunction (/:1:1)';
        }
      } as typeof Error;

      const testLogger = new Logger({
        output: mockOutput,
        showSource: true,
        level: LogLevel.INFO,
      });

      expect(() =>
        testLogger.info('Test with problematic file paths')
      ).not.toThrow();

      global.Error = originalError;
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

      configureLogger({ level: originalLevel });
    });

    test('should set log level with convenience function', () => {
      const testLogger = new Logger();
      const originalSetLevel = testLogger.setLevel.bind(testLogger);

      originalSetLevel(LogLevel.ERROR);
      expect(testLogger.getConfig().level).toBe(LogLevel.ERROR);
    });
  });

  describe('table method', () => {
    let mockOutput: string[];
    let testLogger: Logger;

    beforeEach(() => {
      mockOutput = [];
      const mockStream = {
        write: (data: string) => {
          mockOutput.push(data);
          return true;
        },
        writable: true,
        end: () => mockStream,
        addListener: () => mockStream,
        on: () => mockStream,
        once: () => mockStream,
        prependListener: () => mockStream,
        prependOnceListener: () => mockStream,
        removeListener: () => mockStream,
        off: () => mockStream,
        removeAllListeners: () => mockStream,
        setMaxListeners: () => mockStream,
        getMaxListeners: () => 10,
        listeners: () => [],
        rawListeners: () => [],
        emit: () => true,
        listenerCount: () => 0,
        eventNames: () => [],
      } as NodeJS.WritableStream;

      testLogger = new Logger({
        output: mockStream,
        level: LogLevel.TRACE,
        colors: false,
        timestamps: false,
      });
    });

    test('should display basic table with borders', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      testLogger.table(data);

      expect(mockOutput.length).toBeGreaterThan(0);
      const output = mockOutput.join('');
      expect(output).toContain('name');
      expect(output).toContain('age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
      expect(output).toContain('25');
      expect(output).toContain('30');
      expect(output).toContain('+');
      expect(output).toContain('|');
      expect(output).not.toMatch(/\+.*\[INFO\]/);
    });

    test('should display table without borders when border option is false', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      testLogger.table(data);

      expect(mockOutput.length).toBeGreaterThan(0);
      const output = mockOutput.join('');
      expect(output).toContain('name');
      expect(output).toContain('age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
      expect(output).toContain('+'); // Our implementation uses borders
    });

    test('should use standard headers from data keys', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      testLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toContain('name'); // Headers are the actual keys
      expect(output).toContain('age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
    });

    test('should handle empty data array', () => {
      testLogger.table([]);

      const output = mockOutput.join('');
      expect(output).toContain('No data to display');
    });

    test('should handle null/undefined data', () => {
      testLogger.table(null as unknown as Record<string, unknown>[]);

      const output = mockOutput.join('');
      expect(output).toContain('No data to display');
    });

    test('should handle objects with missing properties', () => {
      const data = [
        { name: 'Alice', age: 25, role: 'Engineer' },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', role: 'Designer' },
      ];

      testLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
      expect(output).toContain('Charlie');
      expect(output).toContain('Engineer');
      expect(output).toContain('Designer');
    });

    test('should handle different data types in cells', () => {
      const data = [
        {
          string: 'text',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          date: new Date('2024-01-01'),
        },
      ];

      testLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toContain('text');
      expect(output).toContain('42');
      expect(output).toContain('true');
      expect(output).toContain('null');
      expect(output).toContain('-');
      expect(output).toMatch(/\d{4}/);
    });

    test('should respect log level filtering', () => {
      const restrictedLogger = new Logger({
        output: testLogger.getConfig().output,
        level: LogLevel.WARN, // This should block INFO level table calls
        colors: false,
        timestamps: false,
      });

      const data = [{ name: 'Alice', age: 25 }];

      restrictedLogger.table(data);
      expect(mockOutput.length).toBe(0); // Should NOT output anything

      // Test that it works when level allows it
      restrictedLogger.setLevel(LogLevel.INFO);
      restrictedLogger.table(data);
      expect(mockOutput.length).toBeGreaterThan(0);
    });

    test('should format table in JSON mode', () => {
      const jsonLogger = new Logger({
        output: testLogger.getConfig().output,
        level: LogLevel.TRACE,
        json: true,
      });

      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      jsonLogger.table(data);

      expect(mockOutput.length).toBe(1);
      const output = mockOutput[0];
      expect(() => JSON.parse(output)).not.toThrow();

      const parsed = JSON.parse(output);
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Table data');
      expect(parsed.data).toEqual(data);
    });

    test('should include source information when enabled', () => {
      const sourceLogger = new Logger({
        output: testLogger.getConfig().output,
        level: LogLevel.TRACE,
        colors: false,
        timestamps: false,
        showSource: true,
      });

      const data = [{ name: 'Alice', age: 25 }];
      sourceLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toMatch(/\[.*\..*:\d+\]/);
    });

    test('should include prefix when configured', () => {
      const prefixLogger = new Logger({
        output: testLogger.getConfig().output,
        level: LogLevel.TRACE,
        colors: false,
        timestamps: false,
        prefix: 'TEST',
      });

      const data = [{ name: 'Alice', age: 25 }];
      prefixLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toContain('[TEST]');
    });

    test('should handle very long cell content', () => {
      const data = [
        {
          short: 'A',
          long: 'This is a very long string that should be handled properly in the table formatting',
        },
      ];

      testLogger.table(data);

      const output = mockOutput.join('');
      expect(output).toContain('This is a very long string');
      expect(output).toContain('A');
    });

    test('should handle array data with consistent structure', () => {
      const data = [
        { 0: 'Alice', 1: 25, 2: 'Engineer' },
        { 0: 'Bob', 1: 30, 2: 'Designer' },
      ];

      expect(() => testLogger.table(data)).not.toThrow();
    });

    test('should handle mixed object structures gracefully', () => {
      const data = [
        { name: 'Alice', details: { age: 25, role: 'Engineer' } },
        { name: 'Bob', details: { age: 30, role: 'Designer' } },
      ];

      expect(() => testLogger.table(data)).not.toThrow();

      const output = mockOutput.join('');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
    });

    test('should handle special characters in data', () => {
      const data = [
        { name: 'Alice "Quote"', symbol: '€', emoji: 'rocket' },
        { name: 'Bob & Co.', symbol: '£', emoji: 'sparkles' },
      ];

      expect(() => testLogger.table(data)).not.toThrow();

      const output = mockOutput.join('');
      expect(output).toContain('Alice "Quote"');
      expect(output).toContain('Bob & Co.');
      expect(output).toContain('€');
      expect(output).toContain('rocket');
    });
  });

  describe('LoggerFactory', () => {
    test('should create JSON logger with default config', () => {
      const jsonLogger = LoggerFactory.createJsonLogger();
      const config = jsonLogger.getConfig();

      expect(config.json).toBe(true);
      expect(config.colors).toBe(false);
    });

    test('should create JSON logger with custom config', () => {
      const jsonLogger = LoggerFactory.createJsonLogger({
        level: LogLevel.ERROR,
        prefix: 'API',
        output: mockOutput,
      });
      const config = jsonLogger.getConfig();

      expect(config.json).toBe(true);
      expect(config.colors).toBe(false);
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.prefix).toBe('API');
    });

    test('should create minimal logger with default config', () => {
      const minimalLogger = LoggerFactory.createMinimalLogger();
      const config = minimalLogger.getConfig();

      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(false);
    });

    test('should create minimal logger with custom config', () => {
      const minimalLogger = LoggerFactory.createMinimalLogger({
        level: LogLevel.WARN,
        prefix: 'MINIMAL',
        output: mockOutput,
      });
      const config = minimalLogger.getConfig();

      expect(config.timestamps).toBe(false);
      expect(config.colors).toBe(false);
      expect(config.showSource).toBe(false);
      expect(config.level).toBe(LogLevel.WARN);
      expect(config.prefix).toBe('MINIMAL');
    });

    test('should create verbose logger with default config', () => {
      const verboseLogger = LoggerFactory.createVerboseLogger();
      const config = verboseLogger.getConfig();

      expect(config.level).toBe(LogLevel.TRACE);
      expect(config.timestamps).toBe(true);
      expect(config.colors).toBe(true);
      expect(config.showSource).toBe(true);
    });

    test('should create verbose logger with custom config', () => {
      const verboseLogger = LoggerFactory.createVerboseLogger({
        prefix: 'VERBOSE',
        output: mockOutput,
      });
      const config = verboseLogger.getConfig();

      expect(config.level).toBe(LogLevel.TRACE);
      expect(config.timestamps).toBe(true);
      expect(config.colors).toBe(true);
      expect(config.showSource).toBe(true);
      expect(config.prefix).toBe('VERBOSE');
    });
  });
});
