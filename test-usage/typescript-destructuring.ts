import { logger, createLogger, LogLevel } from '@calphonse/logger';

logger.info('=== TypeScript Destructuring Test ===');

logger.info('Method 1: Destructured logger works!');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');
logger.trace('This is a trace message');

logger.log.info('Using logger.log.info from TypeScript');
logger.log.error('Using logger.log.error from TypeScript');

const customLogger = createLogger({
  level: LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug(
  'Method 2: Custom logger from destructured createLogger works!'
);

const childLogger = logger.createChildLogger('CHILD');
childLogger.info('Method 3: Child logger from TypeScript works!');

// Test table functionality with array of objects
logger.table(LogLevel.INFO, [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
]);

// Test single object table functionality (new feature)
logger.table({
  'Cache Operation': 'PUT',
  'Cache Tags': 'update, user',
  'Revalidate (s)': 7200,
  Timestamp: new Date().toISOString(),
});

logger.info('TypeScript destructuring test completed successfully!');
