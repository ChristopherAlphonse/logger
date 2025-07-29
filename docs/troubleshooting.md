# Troubleshooting Guide

This guide helps you resolve common issues and debug problems when using the enhanced logger library in enterprise environments.

## Common Issues

### Log Level Not Working

**Problem:** Log messages aren't appearing despite setting the correct log level.

**Possible Causes:**

1. Global log level overriding individual logger settings
2. Environment variables not being read correctly
3. Logger configuration not applied

**Solutions:**

```typescript
import logger, { getGlobalLogLevel, getAllLoggers } from '@calphonse/logger';

// Check global log level
console.log('Global log level:', getGlobalLogLevel());

// Check individual logger configuration
const customLogger = logger.createLogger({ prefix: 'Test' });
console.log('Logger config:', customLogger.getConfig());

// Verify environment variable
console.log('LOG_LEVEL env var:', process.env.LOG_LEVEL);

// Force set level explicitly
customLogger.setLevel('debug');
customLogger.debug('This should appear');
```

### Custom Handler Not Working

**Problem:** Custom handlers aren't being called or aren't working as expected.

**Solutions:**

```typescript
import logger from '@calphonse/logger';

// Verify handler is set
const customLogger = logger.createLogger({ prefix: 'Test' });
customLogger.setHandler(params => {
  console.log('Handler called:', params);
});

// Check if handler is actually set
const handler = customLogger.getHandler();
console.log('Handler exists:', !!handler);

// Test with explicit call
customLogger.info('Test message');
```

### Performance Issues

**Problem:** Logging is causing performance degradation.

**Solutions:**

```typescript
import logger from '@calphonse/logger';

// Use conditional logging
if (logger.isEnabled(LogLevel.DEBUG)) {
  const expensiveData = computeExpensiveData();
  logger.debug('Expensive data:', expensiveData);
}

// Use lazy evaluation
logger.debug('Expensive data:', () => computeExpensiveData());

// Batch log messages
const batchLogger = logger.createLogger({ prefix: 'Batch' });
const messages = [];
// ... collect messages
messages.forEach(msg => batchLogger.info(msg));
```

### Memory Leaks

**Problem:** Logger instances are accumulating and causing memory leaks.

**Solutions:**

```typescript
import { getAllLoggers } from '@calphonse/logger';

// Monitor logger count
const loggers = getAllLoggers();
console.log('Active loggers:', loggers.length);

// Clean up unused loggers (if needed)
// Note: Loggers are automatically managed by the registry
```

## Debug Mode

Enable debug mode to get detailed information about logger operations:

```typescript
import logger from '@calphonse/logger';

// Enable debug logging
logger.setLevel('debug');

// Create a debug logger
const debugLogger = logger.createLogger({
  prefix: 'Debug',
  showSource: true,
});

// Log debug information
debugLogger.debug('Logger configuration', {
  level: debugLogger.getConfig().level,
  prefix: debugLogger.getConfig().prefix,
  handler: !!debugLogger.getHandler(),
});
```

## Environment-Specific Issues

### Production Environment

**Problem:** Too much logging in production affecting performance.

**Solutions:**

```typescript
import logger, { setGlobalLogLevel } from '@calphonse/logger';

// Set appropriate production levels
if (process.env.NODE_ENV === 'production') {
  setGlobalLogLevel('warn');

  // Use JSON format for better parsing
  logger.setConfig({ json: true });

  // Disable colors for better log aggregation
  logger.setConfig({ colors: false });
}
```

### Development Environment

**Problem:** Not enough logging information for debugging.

**Solutions:**

```typescript
import logger from '@calphonse/logger';

// Enable verbose logging for development
if (process.env.NODE_ENV === 'development') {
  logger.setLevel('debug');
  logger.setConfig({
    showSource: true,
    timestamps: true,
    colors: true,
  });
}
```

### Testing Environment

**Problem:** Logs interfering with test output or assertions.

**Solutions:**

```typescript
import logger, { setGlobalLogLevel } from '@calphonse/logger';

// Minimal logging for tests
if (process.env.NODE_ENV === 'test') {
  setGlobalLogLevel('error');

  // Capture logs for assertions
  const testLogs = [];
  setGlobalLogHandler(params => {
    testLogs.push(params);
  });
}
```

## Integration Issues

### External Service Integration

**Problem:** Logs not reaching external services.

**Solutions:**

```typescript
import logger from '@calphonse/logger';

// Add error handling to custom handlers
const apiLogger = logger.createLogger({ prefix: 'API' });

apiLogger.setHandler(async params => {
  try {
    await fetch('https://api.logging-service.com/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      timeout: 5000, // Add timeout
    });
  } catch (error) {
    // Fallback to console if external service fails
    console.error('Failed to send log to external service:', error);
    console.log(`[${params.loggerName}] ${params.level}: ${params.message}`);
  }
});
```

### File Logging Issues

**Problem:** File logging not working or files not being written.

**Solutions:**

```typescript
import logger from '@calphonse/logger';
import fs from 'fs';

// Ensure directory exists
const logDir = './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create writable stream with error handling
const logStream = fs.createWriteStream('./logs/app.log', {
  flags: 'a',
  encoding: 'utf8',
});

logStream.on('error', error => {
  console.error('Log file error:', error);
});

const fileLogger = logger.createLogger({ prefix: 'FileLogger' });
fileLogger.setHandler(params => {
  const logEntry =
    JSON.stringify({
      timestamp: params.timestamp.toISOString(),
      level: params.level,
      message: params.message,
      data: params.data,
    }) + '\n';

  logStream.write(logEntry);
});
```

## Performance Monitoring

### Monitor Logger Performance

```typescript
import logger from '@calphonse/logger';

// Create performance monitoring logger
const perfLogger = logger.createLogger({ prefix: 'Performance' });

// Monitor logging overhead
const startTime = process.hrtime.bigint();

// Your logging operations here
logger.info('Test message');

const endTime = process.hrtime.bigint();
const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

perfLogger.info('Logging performance', {
  duration: `${duration.toFixed(2)}ms`,
  messageCount: 1,
});
```

### Memory Usage Monitoring

```typescript
import { getAllLoggers } from '@calphonse/logger';

// Monitor memory usage
const loggers = getAllLoggers();
const memoryUsage = process.memoryUsage();

logger.info('Memory usage', {
  loggerCount: loggers.length,
  heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
  heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
  external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
});
```

## Common Error Messages

### "Cannot read property 'level' of undefined"

**Cause:** Logger configuration is not properly initialized.

**Solution:**

```typescript
import logger from '@calphonse/logger';

// Ensure logger is properly imported and initialized
const customLogger = logger.createLogger({
  level: 'info',
  prefix: 'MyApp',
});

// Verify configuration
console.log('Config:', customLogger.getConfig());
```

### "Handler is not a function"

**Cause:** Invalid handler function provided.

**Solution:**

```typescript
import logger from '@calphonse/logger';

// Ensure handler is a valid function
const validHandler = params => {
  console.log('Log:', params);
};

const customLogger = logger.createLogger({ prefix: 'Test' });
customLogger.setHandler(validHandler);

// Test the handler
customLogger.info('Test message');
```

### "Log level not found"

**Cause:** Invalid log level string provided.

**Solution:**

```typescript
import logger, { LogLevel } from '@calphonse/logger';

// Use valid log levels
const validLevels = ['error', 'warn', 'info', 'debug', 'trace', 'silent'];

// Or use enum values
logger.setLevel(LogLevel.INFO);
logger.setLevel('info'); // Both work
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** Enable debug logging to see detailed information
2. **Verify configuration:** Ensure all settings are correct
3. **Test in isolation:** Create a minimal example to reproduce the issue
4. **Check dependencies:** Ensure all required packages are installed
5. **Review environment:** Verify environment variables and settings
6. **Search issues:** Check the GitHub repository for similar issues
7. **Create issue:** Provide a minimal reproduction case with error details

## Debug Checklist

When troubleshooting, use this checklist:

- [ ] Verify logger import and initialization
- [ ] Check global log level settings
- [ ] Confirm individual logger configuration
- [ ] Test custom handlers
- [ ] Verify environment variables
- [ ] Check for conflicting configurations
- [ ] Monitor performance impact
- [ ] Validate external service connections
- [ ] Review file permissions (for file logging)
- [ ] Check memory usage patterns

This troubleshooting guide should help you resolve most common issues. For enterprise-specific problems, consider the advanced debugging techniques in the [Advanced Features](./advanced-features.md) guide.
