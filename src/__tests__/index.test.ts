import { logger } from '../index';

describe('Index exports', () => {
  describe('Default logger instance', () => {
    test('should export default logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
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

  describe('Main logger bound methods', () => {
    test('should have bound error method', () => {
      expect(typeof logger.error).toBe('function');
      expect(() => logger.error('test error')).not.toThrow();
    });

    test('should have bound warn method', () => {
      expect(typeof logger.warn).toBe('function');
      expect(() => logger.warn('test warning')).not.toThrow();
    });

    test('should have bound info method', () => {
      expect(typeof logger.info).toBe('function');
      expect(() => logger.info('test info')).not.toThrow();
    });

    test('should have bound debug method', () => {
      expect(typeof logger.debug).toBe('function');
      expect(() => logger.debug('test debug')).not.toThrow();
    });

    test('should have bound trace method', () => {
      expect(typeof logger.trace).toBe('function');
      expect(() => logger.trace('test trace')).not.toThrow();
    });

    test('should have bound setLevel method', () => {
      expect(typeof logger.setLevel).toBe('function');
      const originalLevel = logger.getConfig().level;

      if (originalLevel !== undefined) {
        logger.setLevel(originalLevel);
      }
    });

    test('should have bound setConfig method', () => {
      expect(typeof logger.setConfig).toBe('function');
      const originalConfig = logger.getConfig();
      logger.setConfig({ prefix: 'TEST_BOUND' });
      expect(logger.getConfig().prefix).toBe('TEST_BOUND');
      logger.setConfig(originalConfig);
    });

    test('should have bound getConfig method', () => {
      expect(typeof logger.getConfig).toBe('function');
      const config = logger.getConfig();
      expect(config).toBeDefined();
      expect(typeof config.level).toBe('number');
    });

    test('should have bound child method', () => {
      expect(typeof logger.child).toBe('function');
      const childLogger = logger.child('TEST_CHILD');

      expect(childLogger.getConfig().prefix).toBe('TEST_CHILD');
    });

    test('should have bound isEnabled method', () => {
      expect(typeof logger.isEnabled).toBe('function');
    });
  });
});
