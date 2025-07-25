console.info('=== CommonJS Destructuring Test ===');

const { logger } = require('@calphonse/logger');
logger.info('Method 1: Destructured logger works!');

const loggerDefault = require('@calphonse/logger').default;
loggerDefault.warn('Method 2: Default export works!');

const { logger: myLogger, createLogger, LogLevel } = require('@calphonse/logger');
myLogger.error('Method 3: Multiple destructured exports work!');

const customLogger = createLogger({
  level: LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug('Method 4: Custom logger from destructured createLogger works!');

console.info('All CommonJS import methods work!');
