# Enhanced Logger API

The enhanced logger provides a great developer experience with preset context enums and a console-like API.

## Quick Start

```typescript
import { logger, LogContext } from '@calphonse/logger';

// Basic usage - just like console.log
logger.log('Application started');

// With data object
logger.log('User data received', { userId: 123, name: 'John Doe' });

// With context (the new API you requested!)
logger.log('Query executed', { query: 'SELECT * FROM users' }, ['DATABASE']);

// With multiple contexts
logger.log('User authenticated', { userId: 123 }, ['AUTH', 'SECURITY']);
```

## API Reference

### Main Logger Instance

The library exports a default logger instance that you can use immediately:

```typescript
import { logger } from '@calphonse/logger';
```

### Logging Methods

All logging methods support the same signature:

```typescript
logger.log(message: string, data?: LogData | string[], contexts?: string[]): void
logger.error(message: string, data?: LogData | string[], contexts?: string[]): void
logger.warn(message: string, data?: LogData | string[], contexts?: string[]): void
logger.info(message: string, data?: LogData | string[], contexts?: string[]): void
logger.debug(message: string, data?: LogData | string[], contexts?: string[]): void
logger.trace(message: string, data?: LogData | string[], contexts?: string[]): void
```

### Parameter Combinations

The logger is flexible and accepts different parameter combinations:

```typescript
// Just a message
logger.log('Simple message');

// Message with data
logger.log('User created', { userId: 123, name: 'John' });

// Message with contexts (data parameter is contexts array)
logger.log('Query executed', ['DATABASE']);

// Message with data and contexts
logger.log('User authenticated', { userId: 123 }, ['AUTH', 'SECURITY']);
```

### Available Contexts

The `LogContext` enum provides type-safe context options:

```typescript
// Core contexts
LogContext.AUTH;
LogContext.DATABASE;
LogContext.API;

// Database contexts
LogContext.REDIS;
LogContext.MONGODB;
LogContext.POSTGRES;
LogContext.MYSQL;
LogContext.ELASTICSEARCH;

// Service contexts
LogContext.CACHE;
LogContext.EMAIL;
LogContext.PAYMENT;
LogContext.NOTIFICATION;
LogContext.VALIDATION;
LogContext.SECURITY;
LogContext.PERFORMANCE;

// Infrastructure contexts
LogContext.FILE;
LogContext.NETWORK;
LogContext.QUEUE;
LogContext.SCHEDULER;
LogContext.WEBSOCKET;
LogContext.GRAPHQL;

// Third-party services
LogContext.AWS;
LogContext.GOOGLE;
LogContext.STRIPE;
LogContext.TWILIO;
LogContext.SENDGRID;

// Security contexts
LogContext.JWT;
LogContext.OAUTH;
LogContext.RATE_LIMIT;
LogContext.CORS;
LogContext.HELMET;

// Development contexts
LogContext.TEST;
LogContext.E2E;
LogContext.UNIT;
LogContext.INTEGRATION;
LogContext.BENCHMARK;
LogContext.PROFILING;

// Monitoring contexts
LogContext.MONITORING;
LogContext.ALERTING;
LogContext.METRICS;
LogContext.HEALTH;
LogContext.READINESS;
LogContext.LIVENESS;

// And many more...
```

## Examples

### Database Operations

```typescript
// Query execution
logger.log('Query executed', { query: 'SELECT * FROM users' }, [
  LogContext.DATABASE,
]);

// Connection issues
logger.error('Database connection failed', { error: 'Connection timeout' }, [
  LogContext.DATABASE,
  LogContext.NETWORK,
]);

// Performance monitoring
logger.info('Query completed', { duration: 45, rows: 1000 }, [
  LogContext.DATABASE,
  LogContext.PERFORMANCE,
]);
```

### Authentication

```typescript
// User login
logger.info('User logged in', { userId: 123, method: 'password' }, [
  LogContext.AUTH,
]);

// Failed login attempts
logger.warn('Failed login attempt', { userId: 123, attempts: 3 }, [
  LogContext.AUTH,
  LogContext.SECURITY,
]);

// JWT operations
logger.debug('JWT token generated', { userId: 123, expiresIn: '1h' }, [
  LogContext.JWT,
  LogContext.AUTH,
]);
```

### API Operations

```typescript
// Request handling
logger.info('API request received', { method: 'GET', path: '/api/users' }, [
  LogContext.API,
]);

// Rate limiting
logger.warn('Rate limit approaching', { requests: 95, limit: 100 }, [
  LogContext.API,
  LogContext.RATE_LIMIT,
]);

// Response times
logger.info('Request completed', { duration: 150, statusCode: 200 }, [
  LogContext.API,
  LogContext.PERFORMANCE,
]);
```

### Payment Processing

```typescript
// Payment creation
logger.info('Payment created', { amount: 29.99, currency: 'USD' }, [
  LogContext.PAYMENT,
]);

// Stripe integration
logger.debug('Stripe webhook received', { event: 'payment.succeeded' }, [
  LogContext.PAYMENT,
  LogContext.STRIPE,
]);

// Payment errors
logger.error('Payment failed', { error: 'Insufficient funds' }, [
  LogContext.PAYMENT,
  LogContext.STRIPE,
]);
```

### File Operations

```typescript
// File upload
logger.info('File uploaded', { filename: 'document.pdf', size: '2.5MB' }, [
  LogContext.FILE,
  LogContext.UPLOAD,
]);

// File processing
logger.debug('File processed', { format: 'PDF', pages: 10 }, [LogContext.FILE]);

// File errors
logger.error('File not found', { path: '/uploads/document.pdf' }, [
  LogContext.FILE,
]);
```

## Creating Custom Loggers

You can also create custom logger instances:

```typescript
import { createLogger, LogContext } from '@calphonse/logger';

const customLogger = createLogger({
  level: 'debug',
  prefix: 'MyApp',
  colors: true,
  timestamps: true,
});

customLogger.log('Custom logger message', { data: 'value' }, [LogContext.API]);
```

## Migration from Old API

The enhanced logger is backward compatible. You can still use the old child logger approach:

```typescript
// Old way (still works)
const dbLogger = logger.child('[DATABASE]');
dbLogger.info('Query executed', { query: 'SELECT * FROM users' });

// New way (recommended)
logger.log('Query executed', { query: 'SELECT * FROM users' }, [
  LogContext.DATABASE,
]);
```

## Benefits

1. **Type Safety**: All contexts are available as TypeScript string literals with autocomplete
2. **IntelliSense Support**: When you type quotes, your IDE will show all available context options
3. **Consistent API**: Same signature across all log levels
4. **Flexible Parameters**: Supports different parameter combinations
5. **Great DX**: No need to create child loggers for different contexts
6. **Backward Compatible**: Existing code continues to work
7. **Console-like**: Familiar API similar to `console.log`

## IntelliSense Support

When you use the logger with contexts, TypeScript will provide autocomplete suggestions:

```typescript
// When you type this:
logger.log('message', {}, ['']); // Put cursor between quotes

// Your IDE will show autocomplete for all available contexts:
// 'AUTH', 'DATABASE', 'API', 'CACHE', 'EMAIL', 'PAYMENT', etc.
```

The autocomplete works for all logging methods:

- `logger.log()`
- `logger.error()`
- `logger.warn()`
- `logger.info()`
- `logger.debug()`
- `logger.trace()`

## Advanced Usage

### Custom Contexts

You can extend the context system by creating your own enums:

```typescript
enum CustomContext {
  CUSTOM_SERVICE = 'CUSTOM_SERVICE',
  LEGACY_SYSTEM = 'LEGACY_SYSTEM',
}

logger.log('Custom operation', { data: 'value' }, [
  CustomContext.CUSTOM_SERVICE,
]);
```

### Context Combinations

Mix and match contexts for detailed logging:

```typescript
logger.info(
  'Complex operation',
  {
    userId: 123,
    operation: 'data-sync',
    duration: 500,
  },
  [LogContext.DATABASE, LogContext.PERFORMANCE, LogContext.AUTH]
);
```
