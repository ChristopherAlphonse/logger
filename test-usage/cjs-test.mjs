import logger from '@calphonse/logger';

logger.info('=== CommonJS Require Test ===');

logger.info('This is a CommonJS require test - info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');
logger.trace('This is a trace message');

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

logger.log.info('Using logger.log.info from CommonJS');
logger.log.error('Using logger.log.error from CommonJS');

const customLogger = logger.createLogger({
  level: logger.LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug('Custom logger from CommonJS works!');

const childLogger = logger.createChildLogger('CHILD');
childLogger.info('Child logger from CommonJS works!');

logger.info('CommonJS test completed successfully!');
