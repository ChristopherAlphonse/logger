# Migration Guide

This guide helps you migrate from other popular logging libraries to the enhanced logger library. We'll cover common logging libraries and provide step-by-step migration instructions.

## Migration from Winston

### Winston to Enhanced Logger

**Before (Winston):**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', { error: 'Connection timeout' });
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';

// Configure the logger
logger.setConfig({
  level: 'info',
  timestamps: true,
  json: true,
});

// Create custom handler for file logging
const fileHandler = (params: any) => {
  const fs = require('fs');
  const logEntry =
    JSON.stringify({
      timestamp: params.timestamp.toISOString(),
      level: params.level,
      message: params.message,
      data: params.data,
    }) + '\n';

  // Write to appropriate files based on level
  if (params.level === 'error') {
    fs.appendFileSync('error.log', logEntry);
  }
  fs.appendFileSync('combined.log', logEntry);
};

logger.setHandler(fileHandler);

logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', { error: 'Connection timeout' });
```

### Winston Transports Migration

**File Transport:**

```typescript
import logger from '@calphonse/logger';
import fs from 'fs';

class FileTransport {
  private filename: string;
  private level?: string;

  constructor(options: { filename: string; level?: string }) {
    this.filename = options.filename;
    this.level = options.level;
  }

  handleLog(params: any) {
    // Check level filter
    if (this.level && params.level !== this.level) {
      return;
    }

    const logEntry =
      JSON.stringify({
        timestamp: params.timestamp.toISOString(),
        level: params.level,
        message: params.message,
        data: params.data,
      }) + '\n';

    fs.appendFileSync(this.filename, logEntry);
  }
}

// Usage
const fileTransport = new FileTransport({ filename: 'app.log' });
logger.setHandler(params => fileTransport.handleLog(params));
```

## Migration from Pino

### Pino to Enhanced Logger

**Before (Pino):**

```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => ({ level: label }),
  },
});

logger.info({ port: 3000 }, 'Application started');
logger.error(
  { err: new Error('Database error') },
  'Database connection failed'
);
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';

// Configure for Pino-like behavior
logger.setConfig({
  level: 'info',
  timestamps: true,
  json: true,
});

// Create Pino-compatible handler
const pinoHandler = (params: any) => {
  const logEntry = {
    level: params.level,
    time: params.timestamp.toISOString(),
    msg: params.message,
    ...params.data,
  };

  console.log(JSON.stringify(logEntry));
};

logger.setHandler(pinoHandler);

logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', {
  err: new Error('Database error'),
});
```

## Migration from Bunyan

### Bunyan to Enhanced Logger

**Before (Bunyan):**

```typescript
import bunyan from 'bunyan';

const logger = bunyan.createLogger({
  name: 'myapp',
  level: 'info',
  serializers: bunyan.stdSerializers,
});

logger.info({ port: 3000 }, 'Application started');
logger.error(
  { err: new Error('Database error') },
  'Database connection failed'
);
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';

// Configure for Bunyan-like behavior
const bunyanLogger = logger.createLogger({
  prefix: 'myapp',
  level: 'info',
  json: true,
});

// Create Bunyan-compatible handler
const bunyanHandler = (params: any) => {
  const logEntry = {
    name: params.loggerName,
    level: bunyan.levelFromName[params.level] || 30,
    msg: params.message,
    time: params.timestamp.toISOString(),
    ...params.data,
  };

  console.log(JSON.stringify(logEntry));
};

bunyanLogger.setHandler(bunyanHandler);

bunyanLogger.info('Application started', { port: 3000 });
bunyanLogger.error('Database connection failed', {
  err: new Error('Database error'),
});
```

## Migration from Debug

### Debug to Enhanced Logger

**Before (Debug):**

```typescript
import debug from 'debug';

const appDebug = debug('app:server');
const dbDebug = debug('app:database');

appDebug('Server starting on port %d', 3000);
dbDebug('Database connected to %s', 'mongodb://localhost:27017');
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';

// Create debug-style loggers
const appDebug = logger.createLogger({ prefix: 'app:server' });
const dbDebug = logger.createLogger({ prefix: 'app:database' });

// Set debug level
appDebug.setLevel('debug');
dbDebug.setLevel('debug');

appDebug.debug('Server starting on port %d', 3000);
dbDebug.debug('Database connected to %s', 'mongodb://localhost:27017');
```

## Migration from Console.log

### Console.log to Enhanced Logger

**Before (Console.log):**

```typescript
console.log('Application started on port', 3000);
console.error('Database connection failed:', error);
console.warn('Deprecated feature used');
console.info('User logged in:', userId);
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';

logger.info('Application started on port', { port: 3000 });
logger.error('Database connection failed', { error: error.message });
logger.warn('Deprecated feature used');
logger.info('User logged in', { userId });
```

## Migration from Morgan (HTTP Logging)

### Morgan to Enhanced Logger

**Before (Morgan):**

```typescript
import morgan from 'morgan';
import express from 'express';

const app = express();
app.use(morgan('combined'));
```

**After (Enhanced Logger):**

```typescript
import logger from '@calphonse/logger';
import express from 'express';

const app = express();
const httpLogger = logger.createLogger({ prefix: 'HTTP' });

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    httpLogger.info('HTTP request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });

  next();
});
```

## Migration Strategies

### 1. Gradual Migration

Migrate one module at a time:

```typescript
// Step 1: Create new logger alongside existing one
import logger from '@calphonse/logger';
import winston from 'winston'; // Keep existing

const newLogger = logger.createLogger({ prefix: 'NewModule' });
const oldLogger = winston.createLogger({
  /* existing config */
});

// Step 2: Migrate one function at a time
function newFunction() {
  newLogger.info('Using new logger');
}

function oldFunction() {
  oldLogger.info('Still using old logger');
}

// Step 3: Eventually remove old logger
```

### 2. Compatibility Layer

Create a compatibility layer for smooth migration:

```typescript
import logger from '@calphonse/logger';

// Winston compatibility layer
class WinstonCompatibility {
  private enhancedLogger: any;

  constructor(options: any) {
    this.enhancedLogger = logger.createLogger({
      prefix: options.defaultMeta?.service || 'app',
      level: options.level || 'info',
    });
  }

  info(message: string, meta?: any) {
    this.enhancedLogger.info(message, meta);
  }

  error(message: string, meta?: any) {
    this.enhancedLogger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.enhancedLogger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.enhancedLogger.debug(message, meta);
  }
}

// Usage
const winstonCompatible = new WinstonCompatibility({
  level: 'info',
  defaultMeta: { service: 'myapp' },
});

winstonCompatible.info('Application started', { port: 3000 });
```

### 3. Configuration Migration

Migrate configuration settings:

```typescript
// Winston configuration
const winstonConfig = {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'myapp' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
};

// Migrate to Enhanced Logger
import logger from '@calphonse/logger';

// Set global configuration
logger.setConfig({
  level: winstonConfig.level,
  timestamps: true,
  json: true,
  prefix: winstonConfig.defaultMeta?.service,
});

// Create custom handler for file transport
const fileHandler = (params: any) => {
  const fs = require('fs');
  const logEntry =
    JSON.stringify({
      timestamp: params.timestamp.toISOString(),
      level: params.level,
      message: params.message,
      data: params.data,
    }) + '\n';

  // Console output (equivalent to Console transport)
  console.log(logEntry);

  // File output for errors (equivalent to File transport)
  if (params.level === 'error') {
    fs.appendFileSync('error.log', logEntry);
  }
};

logger.setHandler(fileHandler);
```

## Common Migration Patterns

### 1. Child Logger Migration

**Winston Child Logger:**

```typescript
const childLogger = logger.child({ module: 'database' });
childLogger.info('Database connected');
```

**Enhanced Logger Child:**

```typescript
const childLogger = logger.child('database');
childLogger.info('Database connected');
```

### 2. Log Level Migration

**Winston Levels:**

```typescript
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.verbose('Verbose message');
logger.debug('Debug message');
logger.silly('Silly message');
```

**Enhanced Logger Levels:**

```typescript
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');
logger.trace('Trace message'); // Equivalent to verbose/silly
```

### 3. Metadata Migration

**Winston Metadata:**

```typescript
logger.info('User action', { userId: '123', action: 'login' });
```

**Enhanced Logger Metadata:**

```typescript
logger.info('User action', { userId: '123', action: 'login' });
```

## Testing Migration

### Migration Testing Strategy

```typescript
import logger from '@calphonse/logger';

// Test migration with captured logs
function testMigration() {
  const capturedLogs: any[] = [];

  // Set up test handler
  logger.setHandler(params => {
    capturedLogs.push(params);
  });

  // Test old vs new logging
  const oldStyle = 'console.log("test")';
  const newStyle = 'logger.info("test")';

  // Verify output format
  logger.info('Test message', { data: 'test' });

  console.log('Captured logs:', capturedLogs);

  // Assert expected format
  const lastLog = capturedLogs[capturedLogs.length - 1];
  console.assert(lastLog.message === 'Test message');
  console.assert(lastLog.data.data === 'test');
}
```

## Migration Checklist

### Pre-Migration

- [ ] Audit current logging usage
- [ ] Identify all logging libraries in use
- [ ] Document current log formats and levels
- [ ] Plan migration strategy (gradual vs. all-at-once)
- [ ] Set up testing environment

### During Migration

- [ ] Install enhanced logger package
- [ ] Create compatibility layer if needed
- [ ] Migrate configuration settings
- [ ] Update import statements
- [ ] Test log output format
- [ ] Verify log levels work correctly
- [ ] Check custom handlers/transports

### Post-Migration

- [ ] Remove old logging dependencies
- [ ] Update documentation
- [ ] Train team on new logging patterns
- [ ] Monitor log output in production
- [ ] Optimize performance if needed

## Troubleshooting Migration

### Common Issues

**Issue: Log levels not working**

```typescript
// Check global vs individual logger levels
import { getGlobalLogLevel } from '@calphonse/logger';

console.log('Global level:', getGlobalLogLevel());
console.log('Logger level:', logger.getConfig().level);
```

**Issue: Custom handlers not working**

```typescript
// Verify handler is properly set
const handler = logger.getHandler();
console.log('Handler exists:', !!handler);

// Test handler directly
handler({ level: 'info', message: 'test', timestamp: new Date() });
```

**Issue: Format differences**

```typescript
// Compare old vs new format
const oldFormat =
  '{"level":"info","message":"test","timestamp":"2024-01-15T10:30:00.000Z"}';
const newFormat =
  '{"level":"info","message":"test","timestamp":"2024-01-15T10:30:00.000Z"}';

// Adjust handler to match expected format
logger.setHandler(params => {
  const customFormat = {
    // Customize format to match expectations
    level: params.level,
    message: params.message,
    timestamp: params.timestamp.toISOString(),
    ...params.data,
  };
  console.log(JSON.stringify(customFormat));
});
```

This migration guide should help you smoothly transition from other logging libraries to the enhanced logger while maintaining your existing logging patterns and functionality.
