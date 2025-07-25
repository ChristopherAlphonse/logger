const logger = require('@calphonse/logger').default;

console.info('=== CommonJS Require Test ===');

logger.info('This is a CommonJS require test - info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');
logger.trace('This is a trace message');

logger.log.info('Using logger.log.info from CommonJS');
logger.log.error('Using logger.log.error from CommonJS');

const customLogger = logger.createLogger({
  level: logger.LogLevel.DEBUG,
  prefix: 'CUSTOM',
});
customLogger.debug('Custom logger from CommonJS works!');

const childLogger = logger.createChildLogger('CHILD');
childLogger.info('Child logger from CommonJS works!');

console.info('CommonJS test completed successfully!');
