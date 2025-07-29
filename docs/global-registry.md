# Global Registry

The global registry is a powerful feature that allows you to centrally manage and control all logger instances in your application.

## What is the Global Registry?

The global registry is like a "control center" for all your loggers. It automatically tracks every logger instance you create and allows you to control them all from a single location.

### Key Benefits

- **Centralized Control**: Change settings for all loggers at once
- **Environment Management**: Easy switching between dev/prod/test modes
- **Integration Capabilities**: Send all logs to external services
- **Debugging**: Find and manage all active loggers

## How It Works

### Automatic Registration

Every logger automatically registers itself when created:

```typescript
import logger from '@calphonse/logger';

// These loggers automatically register themselves
const apiLogger = logger.createLogger({ prefix: 'API' });
const dbLogger = logger.createLogger({ prefix: 'Database' });
const cacheLogger = logger.createLogger({ prefix: 'Cache' });

// The registry now contains: [apiLogger, dbLogger, cacheLogger]
```

### Registry Functions

```typescript
import {
  setGlobalLogLevel,
  setGlobalLogHandler,
  getAllLoggers,
  getLogger,
  getGlobalLogLevel,
  getGlobalLogHandler,
} from '@calphonse/logger';
```

## Global Log Level Control

Control the log level for all registered loggers simultaneously.

### Setting Global Level

```typescript
import { setGlobalLogLevel } from '@calphonse/logger';

// Set global level to warn - affects ALL loggers
setGlobalLogLevel('warn');

// Now all loggers will only show warnings and errors
apiLogger.info('This will be hidden'); // Hidden
dbLogger.debug('This will be hidden'); // Hidden
cacheLogger.warn('This will be shown'); // Visible
authLogger.error('This will be shown'); // Visible
```

### Environment-Based Global Control

```typescript
import { setGlobalLogLevel } from '@calphonse/logger';

// Set appropriate global level based on environment
if (process.env.NODE_ENV === 'production') {
  setGlobalLogLevel('warn'); // Only warnings and errors in production
} else if (process.env.NODE_ENV === 'development') {
  setGlobalLogLevel('debug'); // Show all logs in development
} else {
  setGlobalLogLevel('info'); // Default for other environments
}
```

### Checking Global Level

```typescript
import { getGlobalLogLevel } from '@calphonse/logger';

const currentLevel = getGlobalLogLevel();
console.log('Current global log level:', currentLevel);
```

## Global Custom Handlers

Set a custom handler that affects all registered loggers.

### Basic Global Handler

```typescript
import { setGlobalLogHandler } from '@calphonse/logger';

// Set a custom handler for all loggers
setGlobalLogHandler(params => {
  console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
  if (params.data) {
    console.log('Data:', params.data);
  }
});

// Now ALL loggers will use this custom handler
apiLogger.info('API message'); // Output: [API] info: API message
dbLogger.error('DB error'); // Output: [Database] error: DB error
```

### External Service Integration

```typescript
import { setGlobalLogHandler } from '@calphonse/logger';

// Send all logs to external logging service
setGlobalLogHandler(async params => {
  try {
    await fetch('https://api.logging-service.com/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: params.level,
        message: params.message,
        timestamp: params.timestamp,
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
import { setGlobalLogHandler } from '@calphonse/logger';
import fs from 'fs';

// Log all messages to a file
const logStream = fs.createWriteStream('app.log', { flags: 'a' });

setGlobalLogHandler(params => {
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

### Removing Global Handler

```typescript
import { setGlobalLogHandler } from '@calphonse/logger';

// Remove the global handler (return to default behavior)
setGlobalLogHandler(null);

// Now loggers will use their default formatting
apiLogger.info('Back to normal formatting');
```

## Logger Instance Management

### Getting All Loggers

```typescript
import { getAllLoggers } from '@calphonse/logger';

// Get all registered loggers
const allLoggers = getAllLoggers();
console.log('Total registered loggers:', allLoggers.length);

// List all logger prefixes
allLoggers.forEach(logger => {
  const config = logger.getConfig();
  console.log('Logger:', config.prefix);
});
```

### Finding Specific Loggers

```typescript
import { getLogger } from '@calphonse/logger';

// Find a specific logger by prefix
const cacheLogger = getLogger('Cache');
if (cacheLogger) {
  console.log('Found Cache logger');
  cacheLogger.setLevel('debug');
  cacheLogger.debug('Cache logger configured');
} else {
  console.log('Cache logger not found');
}
```

### Logger Discovery

```typescript
import { getAllLoggers } from '@calphonse/logger';

// Discover and configure all loggers
function configureAllLoggers() {
  const loggers = getAllLoggers();

  loggers.forEach(logger => {
    const config = logger.getConfig();

    // Set specific levels for different logger types
    if (config.prefix?.includes('API')) {
      logger.setLevel('info');
    } else if (config.prefix?.includes('Database')) {
      logger.setLevel('debug');
    } else if (config.prefix?.includes('Cache')) {
      logger.setLevel('warn');
    }
  });
}
```

## Advanced Use Cases

### Production Monitoring Setup

```typescript
import { setGlobalLogLevel, setGlobalLogHandler } from '@calphonse/logger';

// Production monitoring configuration
function setupProductionLogging() {
  // Only show warnings and errors in production
  setGlobalLogLevel('warn');

  // Send critical logs to monitoring service
  setGlobalLogHandler(params => {
    if (params.level === 'error') {
      // Send errors to error tracking service
      sendToErrorTrackingService(params);
    } else if (params.level === 'warn') {
      // Send warnings to monitoring dashboard
      sendToMonitoringDashboard(params);
    }

    // Also log to console for local debugging
    console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
  });
}
```

### Development Debugging Setup

```typescript
import { setGlobalLogLevel, setGlobalLogHandler } from '@calphonse/logger';

// Development debugging configuration
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
import { setGlobalLogLevel, setGlobalLogHandler } from '@calphonse/logger';

// Testing environment configuration
function setupTestingLogging() {
  const testLogs: any[] = [];

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
  };
}

// In your tests
const testLogging = setupTestingLogging();

// Run your code
someFunction();

// Assert on logs
expect(testLogging.getLogsByLevel('error')).toHaveLength(0);
```

## Best Practices

### Environment Configuration

```typescript
import { setGlobalLogLevel, setGlobalLogHandler } from '@calphonse/logger';

// Centralized environment configuration
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
```

### Application Startup

```typescript
import { setGlobalLogLevel, getAllLoggers } from '@calphonse/logger';

// Configure logging at application startup
function initializeLogging() {
  // Set global level
  setGlobalLogLevel(process.env.LOG_LEVEL || 'info');

  // Log startup information
  const logger = require('@calphonse/logger').default;
  logger.info('Application starting', {
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeVersion: process.version,
  });

  // Log all registered loggers
  const allLoggers = getAllLoggers();
  logger.info('Registered loggers', {
    count: allLoggers.length,
    loggers: allLoggers.map(l => l.getConfig().prefix),
  });
}
```

The global registry provides powerful centralized control over your logging system, making it easy to manage complex applications with multiple loggers.
