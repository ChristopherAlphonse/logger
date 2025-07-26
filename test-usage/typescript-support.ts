import logger from '@calphonse/logger';

logger.info('TypeScript support test - info message');
logger.warn('TypeScript support test - warning message');
logger.error('TypeScript support test - error message');
logger.debug('TypeScript support test - debug message');

// Test table functionality with array of objects
logger.table(logger.LogLevel.INFO, [
  { name: 'Alice', age: 28, role: 'Engineer', salary: 85000 },
  { name: 'Bob', age: 34, role: 'Designer', salary: 72000 },
  { name: 'Charlie', age: 29, role: 'Manager', salary: 95000 },
  { name: 'Diana', age: 31, role: 'Developer', salary: 78000 },
]);

// Test single object table functionality (new feature)
logger.table({
  'Cache Operation': 'GET',
  'Cache Tags': 'user, profile',
  'Revalidate (s)': 3600,
  Timestamp: new Date().toISOString(),
});

const customLogger = logger.createLogger({
  level: logger.LogLevel.DEBUG,
  prefix: 'TYPESCRIPT',
});
customLogger.debug('Custom logger from TypeScript works!');

const childLogger = logger.createChildLogger('TS-CHILD');
childLogger.info('Child logger from TypeScript works!');
