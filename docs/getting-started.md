# Getting Started

Welcome to the enhanced logger library! This guide will help you get up and running quickly.

## Installation

Install the package using your preferred package manager:

```bash
# Using npm
npm install @calphonse/logger

# Using yarn
yarn add @calphonse/logger

# Using pnpm
pnpm add @calphonse/logger
```

## Quick Start

The simplest way to start logging is to use the default logger instance:

```typescript
import logger from '@calphonse/logger';

// Basic logging
logger.info('Application started');
logger.warn('Low memory warning');
logger.error('Database connection failed');

// Logging with additional data
logger.info('User logged in', { userId: '12345', timestamp: new Date() });
logger.error('API request failed', {
  statusCode: 500,
  endpoint: '/api/users',
  error: 'Internal server error',
});
```

## Available Log Levels

The logger supports five log levels, from most to least critical:

- `error` - Critical errors that need immediate attention
- `warn` - Warnings that should be investigated
- `info` - General information about application flow
- `debug` - Detailed debugging information
- `trace` - Very detailed tracing information

## Basic Usage Examples

### Simple Messages

```typescript
import logger from '@calphonse/logger';

logger.error('Critical system failure');
logger.warn('Resource usage is high');
logger.info('User session created');
logger.debug('Database query executed');
logger.trace('Function entry point reached');
```

### Messages with Data

```typescript
import logger from '@calphonse/logger';

// Log with structured data
logger.info('Payment processed', {
  amount: 99.99,
  currency: 'USD',
  transactionId: 'txn_123456',
  userId: 'user_789',
});

// Log errors with context
logger.error('API request failed', {
  method: 'POST',
  url: '/api/payments',
  statusCode: 500,
  responseTime: 2500,
  error: error.message,
});
```

### Setting Log Levels

```typescript
import logger from '@calphonse/logger';

// Set minimum log level (only messages at or above this level will be shown)
logger.setLevel('warn'); // Only show warnings and errors

logger.debug('This will be hidden'); // Hidden
logger.info('This will be hidden'); // Hidden
logger.warn('This will be shown'); // Visible
logger.error('This will be shown'); // Visible
```

## Next Steps

- Learn about [Custom Loggers](./custom-loggers.md) for more advanced usage
- Explore [Global Registry](./global-registry.md) for centralized control
- Discover [Table Logging](./table-logging.md) for structured data display
- Check out [Advanced Features](./advanced-features.md) for enterprise use cases

## TypeScript Support

The library is written in TypeScript and provides full type safety:

```typescript
import logger, { LogLevel, type LogData } from '@calphonse/logger';

// Type-safe log levels
logger.setLevel(LogLevel.DEBUG);

// Type-safe data objects
const data: LogData = {
  userId: '12345',
  action: 'login',
  timestamp: new Date(),
};

logger.info('User action', data);
```

## Common Patterns

### Application Startup

```typescript
import logger from '@calphonse/logger';

// Set appropriate log level for environment
if (process.env.NODE_ENV === 'production') {
  logger.setLevel('warn');
} else {
  logger.setLevel('debug');
}

logger.info('Application starting', {
  version: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  nodeVersion: process.version,
});
```

### Error Handling

```typescript
import logger from '@calphonse/logger';

try {
  // Your code here
  const result = await riskyOperation();
  logger.info('Operation completed successfully', { result });
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    operation: 'riskyOperation',
  });
}
```

### Performance Monitoring

```typescript
import logger from '@calphonse/logger';

const startTime = Date.now();

// Your operation here
await databaseQuery();

const duration = Date.now() - startTime;
logger.info('Database query completed', {
  duration,
  query: 'SELECT * FROM users',
  rowCount: results.length,
});
```

This covers the basics! The logger is designed to be simple to start with but powerful enough for complex applications. Explore the other documentation sections to learn about advanced features.
