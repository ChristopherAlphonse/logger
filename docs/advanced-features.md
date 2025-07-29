# Advanced Features

This guide covers advanced features and enterprise use cases for the enhanced logger library.

## String-Based Log Levels

The logger supports both enum and string-based log levels for easier configuration.

### String Level Support

```typescript
import logger from '@calphonse/logger';

// String-based levels (more intuitive)
logger.setLevel('debug');
logger.setLevel('info');
logger.setLevel('warn');
logger.setLevel('error');
logger.setLevel('silent'); // Silences all logs

// Enum-based levels (type-safe)
logger.setLevel(LogLevel.DEBUG);
logger.setLevel(LogLevel.INFO);
logger.setLevel(LogLevel.WARN);
logger.setLevel(LogLevel.ERROR);
```

### Level Conversion Functions

```typescript
import {
  stringToLogLevel,
  logLevelToString,
  LogLevel,
} from '@calphonse/logger';

// Convert string to enum
const level = stringToLogLevel('debug'); // Returns LogLevel.DEBUG

// Convert enum to string
const levelString = logLevelToString(LogLevel.DEBUG); // Returns 'debug'

// Available string levels
type LogLevelString = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
```

## Custom Log Handlers

Custom handlers allow you to intercept and process log messages before they are output.

### Basic Custom Handler

```typescript
import logger, { type LogCallbackParams } from '@calphonse/logger';

// Set a custom handler for a specific logger
const customLogger = logger.createLogger({ prefix: 'Custom' });

customLogger.setHandler((params: LogCallbackParams) => {
  console.log(
    `[CUSTOM] ${params.loggerName}: ${params.level.toUpperCase()} - ${
      params.message
    }`
  );
  if (params.data) {
    console.log('Additional data:', params.data);
  }
});

customLogger.info('This goes through custom handler');
```

### Handler Parameters

```typescript
interface LogCallbackParams {
  level: LogLevelString; // 'trace' | 'debug' | 'info' | 'warn' | 'error'
  message: string; // The log message
  data?: LogData; // Additional structured data
  timestamp: Date; // When the log was created
  source?: string; // Source file information (if enabled)
  prefix?: string; // Logger prefix
  loggerName?: string; // Logger name/prefix
}
```

### External Service Integration

```typescript
import logger from '@calphonse/logger';

// Send logs to external service
const apiLogger = logger.createLogger({ prefix: 'API' });

apiLogger.setHandler(async params => {
  try {
    await fetch('https://api.logging-service.com/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: params.level,
        message: params.message,
        timestamp: params.timestamp.toISOString(),
        logger: params.loggerName,
        data: params.data,
        environment: process.env.NODE_ENV,
      }),
    });
  } catch (error) {
    console.error('Failed to send log to external service:', error);
  }
});
```

### File Logging Handler

```typescript
import logger from '@calphonse/logger';
import fs from 'fs';

// Log to file
const fileLogger = logger.createLogger({ prefix: 'FileLogger' });
const logStream = fs.createWriteStream('app.log', { flags: 'a' });

fileLogger.setHandler(params => {
  const logEntry = {
    timestamp: params.timestamp.toISOString(),
    level: params.level,
    logger: params.loggerName,
    message: params.message,
    data: params.data,
  };

  logStream.write(JSON.stringify(logEntry) + '\n');
});
```

### Removing Custom Handler

```typescript
import logger from '@calphonse/logger';

const customLogger = logger.createLogger({ prefix: 'Test' });

// Set custom handler
customLogger.setHandler(params => {
  console.log('Custom handler:', params.message);
});

// Remove custom handler (return to default)
customLogger.setHandler(null);

// Now uses default formatting
customLogger.info('Back to default');
```

## Enterprise Use Cases

### Production Monitoring Setup

```typescript
import logger, {
  setGlobalLogLevel,
  setGlobalLogHandler,
} from '@calphonse/logger';

function setupProductionLogging() {
  // Only show warnings and errors in production
  setGlobalLogLevel('warn');

  // Send critical logs to monitoring services
  setGlobalLogHandler(params => {
    // Send errors to error tracking service
    if (params.level === 'error') {
      sendToErrorTrackingService(params);
    }

    // Send warnings to monitoring dashboard
    if (params.level === 'warn') {
      sendToMonitoringDashboard(params);
    }

    // Log to console for local debugging
    console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
  });
}

function sendToErrorTrackingService(params: LogCallbackParams) {
  // Implementation for error tracking service (e.g., Sentry)
  console.log('Sending to error tracking service:', params);
}

function sendToMonitoringDashboard(params: LogCallbackParams) {
  // Implementation for monitoring dashboard (e.g., DataDog, New Relic)
  console.log('Sending to monitoring dashboard:', params);
}
```

### Development Debugging Setup

```typescript
import logger, {
  setGlobalLogLevel,
  setGlobalLogHandler,
} from '@calphonse/logger';

function setupDevelopmentLogging() {
  // Show all logs in development
  setGlobalLogLevel('debug');

  // Enhanced logging for development
  setGlobalLogHandler(params => {
    const timestamp = params.timestamp.toISOString();
    const level = params.level.toUpperCase();
    const loggerName = params.loggerName || 'default';

    console.log(`[${timestamp}] [${loggerName}] [${level}] ${params.message}`);

    if (params.data) {
      console.log('Data:', JSON.stringify(params.data, null, 2));
    }

    if (params.source) {
      console.log('Source:', params.source);
    }
  });
}
```

### Testing Environment Setup

```typescript
import logger, {
  setGlobalLogLevel,
  setGlobalLogHandler,
} from '@calphonse/logger';

function setupTestingLogging() {
  const testLogs: LogCallbackParams[] = [];

  // Only show errors in tests
  setGlobalLogLevel('error');

  // Capture logs for assertions
  setGlobalLogHandler(params => {
    testLogs.push(params);
  });

  return {
    logs: testLogs,
    clearLogs: () => (testLogs.length = 0),
    getLogsByLevel: (level: string) =>
      testLogs.filter(log => log.level === level),
    getLogsByLogger: (loggerName: string) =>
      testLogs.filter(log => log.loggerName === loggerName),
  };
}

// In your tests
const testLogging = setupTestingLogging();

// Run your code
someFunction();

// Assert on logs
expect(testLogging.getLogsByLevel('error')).toHaveLength(0);
expect(testLogging.getLogsByLogger('API')).toHaveLength(2);
```

### Multi-Environment Configuration

```typescript
import logger, {
  setGlobalLogLevel,
  setGlobalLogHandler,
} from '@calphonse/logger';

function configureLoggingForEnvironment() {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      setGlobalLogLevel('warn');
      setGlobalLogHandler(productionHandler);
      break;

    case 'staging':
      setGlobalLogLevel('info');
      setGlobalLogHandler(stagingHandler);
      break;

    case 'development':
      setGlobalLogLevel('debug');
      setGlobalLogHandler(developmentHandler);
      break;

    case 'test':
      setGlobalLogLevel('error');
      setGlobalLogHandler(testHandler);
      break;
  }
}

function productionHandler(params: LogCallbackParams) {
  // Send to production logging service
  sendToProductionService(params);
}

function stagingHandler(params: LogCallbackParams) {
  // Send to staging logging service
  sendToStagingService(params);
}

function developmentHandler(params: LogCallbackParams) {
  // Enhanced console output for development
  console.log(
    `[DEV] ${params.loggerName}: ${params.level} - ${params.message}`
  );
}

function testHandler(params: LogCallbackParams) {
  // Capture logs for testing
  testLogs.push(params);
}
```

## Performance Optimization

### Conditional Logging

```typescript
import logger from '@calphonse/logger';

// Check if logging is enabled before expensive operations
if (logger.isEnabled(LogLevel.DEBUG)) {
  const expensiveData = computeExpensiveData();
  logger.debug('Expensive data computed', expensiveData);
}

// Or use the convenience method
logger.debug('Expensive data computed', computeExpensiveData());
```

### Lazy Evaluation

```typescript
import logger from '@calphonse/logger';

// Use functions for expensive data that should only be computed if logging is enabled
logger.debug('User data', () => ({
  profile: getUserProfile(userId),
  preferences: getUserPreferences(userId),
  statistics: computeUserStatistics(userId),
}));
```

### Batch Logging

```typescript
import logger from '@calphonse/logger';

// Batch multiple log messages
function logBatchOperations(operations: any[]) {
  const batchLogger = logger.createLogger({ prefix: 'Batch' });

  operations.forEach((operation, index) => {
    batchLogger.info(`Operation ${index + 1} completed`, {
      operation: operation.name,
      duration: operation.duration,
      status: operation.status,
    });
  });
}
```

## Security Considerations

### Sensitive Data Filtering

```typescript
import logger from '@calphonse/logger';

// Filter sensitive data before logging
function sanitizeData(data: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  return data;
}

// Use in custom handler
const secureLogger = logger.createLogger({ prefix: 'Secure' });

secureLogger.setHandler(params => {
  const sanitizedData = params.data ? sanitizeData(params.data) : undefined;

  console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
  if (sanitizedData) {
    console.log('Data:', sanitizedData);
  }
});
```

### Log Level Security

```typescript
import logger from '@calphonse/logger';

// Ensure sensitive operations are logged at appropriate levels
function logUserAuthentication(userId: string, success: boolean) {
  if (success) {
    logger.info('User authenticated successfully', { userId });
  } else {
    logger.warn('Failed authentication attempt', { userId });
  }
}

function logDatabaseConnection(details: any) {
  // Log connection details at debug level to avoid exposing in production
  logger.debug('Database connection details', details);
}
```

## Integration Examples

### Express.js Middleware

```typescript
import logger from '@calphonse/logger';
import express from 'express';

const app = express();
const apiLogger = logger.createLogger({ prefix: 'API' });

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    apiLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
});
```

### Database Query Logging

```typescript
import logger from '@calphonse/logger';

const dbLogger = logger.createLogger({ prefix: 'Database' });

// Database query wrapper
async function executeQuery(query: string, params: any[]) {
  const startTime = Date.now();

  try {
    const result = await database.query(query, params);
    const duration = Date.now() - startTime;

    dbLogger.debug('Query executed successfully', {
      query,
      params,
      duration,
      rowCount: result.length,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    dbLogger.error('Query failed', {
      query,
      params,
      duration,
      error: error.message,
    });

    throw error;
  }
}
```

### Cache Operation Logging

```typescript
import logger from '@calphonse/logger';

const cacheLogger = logger.createLogger({ prefix: 'Cache' });

// Cache operation wrapper
async function cacheOperation(operation: string, key: string, data?: any) {
  const startTime = Date.now();

  try {
    let result;

    switch (operation) {
      case 'GET':
        result = await cache.get(key);
        cacheLogger.info('Cache get operation', {
          operation,
          key,
          hit: result !== null,
          duration: Date.now() - startTime,
        });
        break;

      case 'SET':
        await cache.set(key, data);
        cacheLogger.info('Cache set operation', {
          operation,
          key,
          duration: Date.now() - startTime,
        });
        break;

      case 'DELETE':
        await cache.delete(key);
        cacheLogger.info('Cache delete operation', {
          operation,
          key,
          duration: Date.now() - startTime,
        });
        break;
    }

    return result;
  } catch (error) {
    cacheLogger.error('Cache operation failed', {
      operation,
      key,
      duration: Date.now() - startTime,
      error: error.message,
    });

    throw error;
  }
}
```

These advanced features provide the flexibility and power needed for enterprise applications while maintaining simplicity for basic use cases.
