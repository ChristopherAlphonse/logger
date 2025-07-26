import logger from '@calphonse/logger';

logger.info('=== ESM Import Test ===');

logger.info('This is an ESM import test - info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');

// Test table functionality with array of objects
logger.table(logger.LogLevel.INFO, [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
  { name: 'Charlie', age: 29, role: 'Manager' },
]);

// Test single object table functionality (new feature)
logger.table({
  'Cache Operation': 'POST',
  'Cache Tags': 'api, data',
  'Revalidate (s)': 1800,
  Timestamp: new Date().toISOString(),
});

logger.log.info('Using logger.log.info from ESM');
logger.log.error('Using logger.log.error from ESM');

const customLogger = logger.createLogger({
  level: logger.LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug('Custom logger from ESM works!');

const childLogger = logger.createChildLogger('CHILD');
childLogger.info('Child logger from ESM works!');

logger.info('ESM test completed successfully!');
