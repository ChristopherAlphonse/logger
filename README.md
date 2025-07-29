# @calphonse/logger

> A beautiful, intelligent logger for Node.js that makes debugging a joy

<p align="center">
  <a href="https://www.npmjs.com/package/@calphonse/logger">
    <img src="https://flat.badgen.net/npm/v/@calphonse/logger?icon=npm" alt="npm"/>
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript"/>
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white" alt="Node.js"/>
  </a>
</p>
##Why This Logger?

Tired of `logger.log` chaos? This logger transforms your debugging experience with:

- **Beautiful colored output** - Easy to read and visually organized
- **Structured logging** - JSON support with rich context
- **Smart context detection** - Automatically includes relevant information
- **Zero performance impact** - Async logging that won't slow your app
- **Developer-friendly** - Works great out of the box, highly configurable
- **TypeScript first** - Full type safety and excellent IntelliSense

![Logger Demo](examples/demo.png)

## Installation

```bash
npm install @calphonse/logger
# or
pnpm add @calphonse/logger
# or
yarn add @calphonse/logger
```

## Quick Start

### Enhanced API (Recommended)

```typescript
import { logger, LogContext } from '@calphonse/logger';

// Basic usage - just like console.log but better!
logger.log('Application started');

// With data object
logger.log('User data received', { userId: 123, name: 'John Doe' });

// With context (the new API you requested!)
logger.log('Query executed', { query: 'SELECT * FROM users' }, ['DATABASE']);

// With multiple contexts
logger.log('User authenticated', { userId: 123 }, ['AUTH', 'SECURITY']);

// Different log levels with contexts
logger.error('Database connection failed', { error: 'Connection timeout' }, [
  'DATABASE',
]);
logger.warn('Rate limit approaching', { requests: 95, limit: 100 }, ['API']);
logger.info('Payment processed', { amount: 29.99 }, ['PAYMENT']);
```

### Classic API (Still Supported)

```typescript
import { logger } from '@calphonse/logger';

// Basic usage - just like logger.log but better!
logger.info('Application started');
logger.warn('High memory usage detected');
logger.error('Something went wrong', { error: 'details' });

// Structured logging with context
logger.info('User login attempt', {
  userId: '12345',
  method: 'email',
  ipAddress: '192.168.1.100',
  timestamp: new Date().toISOString(),
});
```

## Features

### Beautiful Terminal Output

```typescript
import { logger } from '@calphonse/logger';

logger.info('Server starting on port 3000');
logger.warn('Database connection slow');
logger.error('Failed to process request', {
  requestId: 'req-123',
  error: 'Connection timeout',
});
```

**Output:**

```
[14:30:25] [INFO] Server starting on port 3000
[14:30:26] [WARN] Database connection slow
[14:30:27] [ERROR] Failed to process request {
  "requestId": "req-123",
  "error": "Connection timeout"
}
```

### Structured JSON Logging

```typescript
import { Logger } from '@calphonse/logger';

const jsonLogger = new Logger({ json: true });

jsonLogger.info('User action', {
  action: 'login',
  userId: '12345',
  timestamp: new Date().toISOString(),
  metadata: {
    userAgent: 'Mozilla/5.0...',
    ipAddress: '192.168.1.100',
  },
});
```

### Child Loggers for Context

```typescript
import { logger } from '@calphonse/logger';

// Create child loggers for different components
const userLogger = logger.child('[USER]');
const dbLogger = logger.child('[DATABASE]');
const apiLogger = logger.child('[API]');

userLogger.info('User created', { userId: '123' });
dbLogger.info('Query executed', { query: 'SELECT * FROM users' });
apiLogger.info('Request processed', { endpoint: '/api/users' });
```

### Enhanced Context API (New!)

Instead of creating child loggers, use the new context-based API:

```typescript
import { logger, LogContext } from '@calphonse/logger';

// No need to create child loggers!
logger.log('User created', { userId: '123' }, ['AUTH']);
logger.log('Query executed', { query: 'SELECT * FROM users' }, ['DATABASE']);
logger.log('Request processed', { endpoint: '/api/users' }, ['API']);

// Multiple contexts for complex operations
logger.log('User authenticated', { userId: '123' }, [
  'AUTH',
  'SECURITY',
  'JWT',
]);
```

### Available Contexts

The enhanced logger comes with 50+ preset contexts for common scenarios:

```typescript
import { LogContext } from '@calphonse/logger';

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
LogContext.SECURITY;
LogContext.PERFORMANCE;

// Third-party services
LogContext.AWS;
LogContext.GOOGLE;
LogContext.STRIPE;
LogContext.TWILIO;
LogContext.SENDGRID;

// And many more...
```

### Flexible Configuration

```typescript
import { Logger, LogLevel } from '@calphonse/logger';

const customLogger = new Logger({
  level: LogLevel.DEBUG, // Set minimum log level
  timestamps: true, // Include timestamps
  colors: true, // Enable colored output
  showSource: true, // Show file/line information
  prefix: '[MY-APP]', // Custom prefix
  json: false, // Text output (not JSON)
  timestampFormat: 'HH:mm:ss.SSS', // Custom timestamp format
});
```

### Factory Methods

```typescript
import { Logger } from '@calphonse/logger';
```

## API Reference

### Core Methods

```typescript
// Log levels (in order of severity)
logger.error(message: string, data?: any): void
logger.warn(message: string, data?: any): void
logger.info(message: string, data?: any): void
logger.debug(message: string, data?: any): void
logger.trace(message: string, data?: any): void

// Configuration
logger.setLevel(level: LogLevel): void
logger.setConfig(config: Partial<LoggerConfig>): void
logger.getConfig(): LoggerConfig
logger.isEnabled(level: LogLevel): boolean

// Child loggers
logger.child(prefix: string): Logger
```

## Use Cases

### Express.js Middleware

```typescript
import express from 'express';
import { logger } from '@calphonse/logger';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
});
```

### Error Handling

```typescript
import { logger } from '@calphonse/logger';

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString(),
  });
});
```

### Database Operations

```typescript
import { logger } from '@calphonse/logger';

const dbLogger = logger.child('[DATABASE]');

async function createUser(userData) {
  const start = Date.now();

  try {
    dbLogger.info('Creating user', { email: userData.email });

    const user = await db.users.create(userData);

    const duration = Date.now() - start;
    dbLogger.info('User created successfully', {
      userId: user.id,
      duration: `${duration}ms`,
    });

    return user;
  } catch (error) {
    const duration = Date.now() - start;
    dbLogger.error('Failed to create user', {
      email: userData.email,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/ChristopherAlphonse/logger.git
cd logger

# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Run tests
pnpm test

# Run quality checks
pnpm quality
```

### Available Scripts

- `pnpm dev` - Development mode with watch
- `pnpm build` - Build the project
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Check for linting issues
- `pnpm format` - Format code
- `pnpm quality` - Run all quality checks
- `pnpm example:basic` - Run basic usage example
- `pnpm example:error` - Run error handling example

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run quality checks: `pnpm quality`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Roadmap

We're working on exciting new features!:

- **Smart Context Detection** - Automatic context inclusion
- **Performance Monitoring** - Built-in performance insights
- **Advanced Filtering** - Smart log filtering and search
- **Framework Integrations** - Express, Fastify, NestJS support
- **Plugin System** - Extensible architecture

## Acknowledgments

- Built with [Chalk](https://github.com/chalk/chalk) for beautiful terminal colors
- Inspired by the need for better debugging tools in Node.js

---

**Made with ❤️ for the Node.js community**

If this logger helps you debug faster, please give it a ⭐ on GitHub!
