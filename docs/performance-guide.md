# Performance Tuning Guide

This guide provides comprehensive performance optimization strategies, benchmarks, and best practices for using the enhanced logger library in high-performance enterprise applications.

## Performance Benchmarks

### Baseline Performance Metrics

Our logger is designed for high performance with minimal overhead. Here are typical performance characteristics:

```typescript
import logger from '@calphonse/logger';

// Performance test setup
const iterations = 100000;
const startTime = process.hrtime.bigint();

// Test basic logging performance
for (let i = 0; i < iterations; i++) {
  logger.info('Test message');
}

const endTime = process.hrtime.bigint();
const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
const avgTime = duration / iterations;

console.log(`Average time per log: ${avgTime.toFixed(4)}ms`);
console.log(`Logs per second: ${Math.round(1000 / avgTime)}`);
```

**Typical Results:**

- **Basic logging:** ~0.01ms per log (100,000 logs/second)
- **With data objects:** ~0.02ms per log (50,000 logs/second)
- **With custom handlers:** ~0.05ms per log (20,000 logs/second)
- **JSON format:** ~0.03ms per log (33,000 logs/second)

## Optimization Strategies

### 1. Conditional Logging

Always check if logging is enabled before expensive operations:

```typescript
import logger, { LogLevel } from '@calphonse/logger';

// ❌ Bad: Expensive operation always executed
logger.debug('User data:', computeExpensiveUserData(userId));

// ✅ Good: Conditional execution
if (logger.isEnabled(LogLevel.DEBUG)) {
  logger.debug('User data:', computeExpensiveUserData(userId));
}

// ✅ Better: Lazy evaluation
logger.debug('User data:', () => computeExpensiveUserData(userId));
```

### 2. Lazy Evaluation

Use functions for expensive data that should only be computed if logging is enabled:

```typescript
import logger from '@calphonse/logger';

// Expensive data computation
function computeUserAnalytics(userId: string) {
  // This is expensive and should only run if needed
  return {
    profile: getUserProfile(userId),
    preferences: getUserPreferences(userId),
    statistics: computeUserStatistics(userId),
    recommendations: generateRecommendations(userId),
  };
}

// Use lazy evaluation
logger.debug('User analytics', () => computeUserAnalytics(userId));
```

### 3. Batch Logging

Group multiple log messages to reduce overhead:

```typescript
import logger from '@calphonse/logger';

// ❌ Bad: Multiple individual logs
operations.forEach((op, index) => {
  logger.info(`Operation ${index + 1} completed`, { operation: op.name });
});

// ✅ Good: Batch logging
const batchLogger = logger.createLogger({ prefix: 'Batch' });
const batchData = operations.map((op, index) => ({
  operation: op.name,
  index: index + 1,
  status: 'completed',
}));

batchLogger.info('Batch operations completed', { operations: batchData });
```

### 4. Optimized Custom Handlers

Design custom handlers for performance:

```typescript
import logger from '@calphonse/logger';

// ❌ Bad: Synchronous external API calls
const slowLogger = logger.createLogger({ prefix: 'Slow' });
slowLogger.setHandler(async params => {
  await fetch('https://api.logging-service.com/logs', {
    method: 'POST',
    body: JSON.stringify(params),
  });
});

// ✅ Good: Asynchronous with buffering
const fastLogger = logger.createLogger({ prefix: 'Fast' });
const logBuffer = [];
const bufferSize = 100;
const flushInterval = 5000; // 5 seconds

fastLogger.setHandler(params => {
  logBuffer.push(params);

  if (logBuffer.length >= bufferSize) {
    flushLogs();
  }
});

// Flush logs periodically
setInterval(flushLogs, flushInterval);

async function flushLogs() {
  if (logBuffer.length === 0) return;

  const logsToSend = logBuffer.splice(0);

  try {
    await fetch('https://api.logging-service.com/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
    });
  } catch (error) {
    console.error('Failed to send logs:', error);
  }
}
```

## Memory Optimization

### 1. Logger Instance Management

Monitor and manage logger instances:

```typescript
import { getAllLoggers } from '@calphonse/logger';

// Monitor logger count
function monitorLoggers() {
  const loggers = getAllLoggers();
  const memoryUsage = process.memoryUsage();

  logger.info('Logger monitoring', {
    loggerCount: loggers.length,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
  });
}

// Run monitoring periodically
setInterval(monitorLoggers, 60000); // Every minute
```

### 2. Data Object Optimization

Optimize the data objects you pass to loggers:

```typescript
import logger from '@calphonse/logger';

// ❌ Bad: Large objects with unnecessary data
logger.info('User action', {
  user: {
    id: userId,
    name: userName,
    email: userEmail,
    preferences: userPreferences, // Large object
    history: userHistory, // Very large array
    metadata: userMetadata, // Complex nested object
  },
});

// ✅ Good: Only log necessary data
logger.info('User action', {
  userId,
  action: 'login',
  timestamp: new Date().toISOString(),
});

// ✅ Better: Extract only needed fields
logger.info('User action', {
  userId,
  action: 'login',
  userType: user.type,
  timestamp: new Date().toISOString(),
});
```

### 3. Circular Reference Handling

Avoid circular references in logged objects:

```typescript
import logger from '@calphonse/logger';

// ❌ Bad: Circular reference
const user = { name: 'John' };
user.self = user;
logger.info('User data', { user }); // Will cause issues

// ✅ Good: Safe serialization
function safeSerialize(obj: any): any {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    })
  );
}

logger.info('User data', { user: safeSerialize(user) });
```

## Production Performance Tuning

### 1. Environment-Specific Optimization

```typescript
import logger, { setGlobalLogLevel } from '@calphonse/logger';

function optimizeForEnvironment() {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      // Production: Minimal logging, maximum performance
      setGlobalLogLevel('warn');
      logger.setConfig({
        colors: false, // Disable colors for better performance
        json: true, // JSON format for better parsing
        timestamps: false, // Disable timestamps if not needed
        showSource: false, // Disable source info
      });
      break;

    case 'development':
      // Development: Full logging for debugging
      setGlobalLogLevel('debug');
      logger.setConfig({
        colors: true,
        timestamps: true,
        showSource: true,
      });
      break;

    case 'test':
      // Test: Minimal logging for fast tests
      setGlobalLogLevel('error');
      break;
  }
}
```

### 2. High-Throughput Logging

For applications with extremely high logging requirements:

```typescript
import logger from '@calphonse/logger';

// High-performance logger configuration
const highPerfLogger = logger.createLogger({
  prefix: 'HighPerf',
  level: 'warn', // Only log important messages
  colors: false, // Disable colors
  timestamps: false, // Disable timestamps
  json: true, // Use JSON for better parsing
});

// Use worker threads for logging in high-throughput scenarios
import { Worker } from 'worker_threads';

class HighThroughputLogger {
  private worker: Worker;
  private messageQueue: any[] = [];

  constructor() {
    this.worker = new Worker(
      `
      const { parentPort } = require('worker_threads');

      parentPort.on('message', (data) => {
        // Process log message in worker thread
        console.log(JSON.stringify(data));
      });
    `,
      { eval: true }
    );
  }

  log(level: string, message: string, data?: any) {
    this.worker.postMessage({ level, message, data, timestamp: new Date() });
  }
}
```

### 3. Async Logging

Implement asynchronous logging for non-blocking operations:

```typescript
import logger from '@calphonse/logger';

// Async logging wrapper
class AsyncLogger {
  private queue: Array<() => void> = [];
  private processing = false;

  async log(level: string, message: string, data?: any) {
    return new Promise<void>(resolve => {
      this.queue.push(() => {
        logger[level](message, data);
        resolve();
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const logFn = this.queue.shift();
      if (logFn) {
        logFn();
        // Small delay to prevent blocking
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    this.processing = false;
  }
}

const asyncLogger = new AsyncLogger();
```

## Performance Monitoring

### 1. Logger Performance Metrics

```typescript
import logger from '@calphonse/logger';

class LoggerPerformanceMonitor {
  private metrics = {
    totalLogs: 0,
    totalTime: 0,
    averageTime: 0,
    slowestLog: 0,
    errors: 0,
  };

  wrapLogger(originalLogger: any) {
    const wrappedLogger = { ...originalLogger };

    ['error', 'warn', 'info', 'debug', 'trace'].forEach(level => {
      wrappedLogger[level] = (...args: any[]) => {
        const startTime = process.hrtime.bigint();

        try {
          originalLogger[level](...args);
          this.recordSuccess(startTime);
        } catch (error) {
          this.recordError();
          throw error;
        }
      };
    });

    return wrappedLogger;
  }

  private recordSuccess(startTime: bigint) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    this.metrics.totalLogs++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalLogs;
    this.metrics.slowestLog = Math.max(this.metrics.slowestLog, duration);
  }

  private recordError() {
    this.metrics.errors++;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalLogs: 0,
      totalTime: 0,
      averageTime: 0,
      slowestLog: 0,
      errors: 0,
    };
  }
}

// Usage
const monitor = new LoggerPerformanceMonitor();
const monitoredLogger = monitor.wrapLogger(logger);

// Log some messages
monitoredLogger.info('Test message');
monitoredLogger.error('Test error');

// Check metrics
console.log('Performance metrics:', monitor.getMetrics());
```

### 2. Memory Usage Monitoring

```typescript
import { getAllLoggers } from '@calphonse/logger';

function monitorMemoryUsage() {
  const loggers = getAllLoggers();
  const memoryUsage = process.memoryUsage();

  const metrics = {
    loggerCount: loggers.length,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
  };

  // Alert if memory usage is high
  if (metrics.heapUsed > 100) {
    // 100MB threshold
    logger.warn('High memory usage detected', metrics);
  }

  return metrics;
}

// Monitor every 30 seconds
setInterval(monitorMemoryUsage, 30000);
```

## Best Practices Summary

### Performance Checklist

- [ ] Use conditional logging for expensive operations
- [ ] Implement lazy evaluation for complex data
- [ ] Batch log messages when possible
- [ ] Optimize custom handlers for async operations
- [ ] Monitor logger instance count
- [ ] Avoid circular references in logged objects
- [ ] Use appropriate log levels for environment
- [ ] Implement buffering for external service calls
- [ ] Monitor memory usage regularly
- [ ] Use worker threads for high-throughput scenarios

### Performance Anti-Patterns to Avoid

- ❌ Logging in tight loops without level checks
- ❌ Synchronous external API calls in handlers
- ❌ Logging large objects unnecessarily
- ❌ Creating too many logger instances
- ❌ Blocking operations in custom handlers
- ❌ Logging sensitive data without filtering

This performance guide should help you optimize your logging implementation for enterprise-scale applications. Monitor your application's performance and adjust these strategies based on your specific requirements.
