import logger from '@calphonse/logger';

logger.info('=== Single Object Table Test ===');

// Test the exact use case from the user
function logCacheInfo(operation, tags, revalidate) {
  const tableData = {
    'Cache Operation': operation,
    'Cache Tags': tags ? tags.join(', ') : undefined,
    'Revalidate (s)': revalidate,
    Timestamp: new Date().toISOString(),
  };
  logger.table(tableData);
  logger.debug('Cache operation completed', { operation, tags, revalidate });
}

// Test the function
logger.info('Testing logCacheInfo function:');
logCacheInfo('GET', ['user', 'profile'], 3600);

logger.info('\nTesting different data types:');
logger.table({
  'String Value': 'Hello World',
  'Number Value': 42,
  'Boolean Value': true,
  'Undefined Value': undefined,
  'Null Value': null,
});

logger.info('\nTesting with nested data:');
logger.table({
  Simple: 'value',
  Object: JSON.stringify({ nested: 'data' }),
  Array: JSON.stringify([1, 2, 3]),
});

logger.info('\n=== Single Object Table Test Completed ===');
