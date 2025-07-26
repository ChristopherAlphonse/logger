logger.info('=== ESM Destructuring Test ===');

import { logger, createLogger, LogLevel } from '@calphonse/logger';
logger.info('Method 1: Destructured logger works!');

import loggerDefault from '@calphonse/logger';
loggerDefault.warn('Method 2: Default export works!');

import { logger as myLogger } from '@calphonse/logger';
myLogger.error('Method 3: Multiple destructured exports work!');

const customLogger = createLogger({
  level: LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug(
  'Method 4: Custom logger from destructured createLogger works!'
);

logger.info('All ESM import methods work!');
