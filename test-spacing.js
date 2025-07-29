// Test context spacing fix
const { logger } = require('./dist/index.cjs.js');

console.log('🔧 Testing Context Spacing Fix\n');

// Test multiple contexts to ensure proper spacing
console.log('=== Multiple Contexts with Proper Spacing ===');
logger.log('User registration flow', { user: 'john@example.com' }, [
  'AUTH',
  'DATABASE',
  'EMAIL',
]);
logger.log('API with caching', { endpoint: '/api/products', cached: true }, [
  'API',
  'CACHE',
  'PERFORMANCE',
]);
logger.log('Payment processing', { amount: 5000, method: 'card' }, [
  'PAYMENT',
  'STRIPE',
  'DATABASE',
]);
logger.log(
  'File upload with validation',
  { file: 'document.pdf', size: '5MB' },
  ['UPLOAD', 'VALIDATION', 'AWS']
);

// Test different color combinations
console.log('\n=== Different Color Combinations ===');
logger.log('Database operations', { query: 'SELECT * FROM users' }, [
  'POSTGRES',
  'CACHE',
]);
logger.log('Security check', { user: 'admin', action: 'delete' }, [
  'AUTH',
  'SECURITY',
  'PERMISSION',
]);
logger.log('System monitoring', { cpu: '45%', memory: '2.1GB' }, [
  'MONITORING',
  'HEALTH',
  'METRICS',
]);

console.log('\n✅ Spacing Test Complete!');
