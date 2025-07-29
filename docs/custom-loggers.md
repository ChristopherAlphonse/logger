# Custom Loggers

Learn how to create and configure custom logger instances for different parts of your application.

## Creating Custom Loggers

While the default logger is great for simple applications, custom loggers allow you to create specialized logging instances with different configurations.

### Basic Custom Logger

```typescript
import logger from '@calphonse/logger';

// Create a custom logger with specific configuration
const apiLogger = logger.createLogger({
  prefix: 'API',
  level: 'debug',
  colors: true,
  timestamps: true,
});

// Use the custom logger
apiLogger.info('API server started');
apiLogger.debug('Request received', { method: 'GET', path: '/users' });
apiLogger.error('Database connection failed', { errorCode: 'DB001' });
```

### Logger Configuration Options

```typescript
import logger, { LogLevel } from '@calphonse/logger';

const customLogger = logger.createLogger({
  // Log level (string or enum)
  level: 'debug', // or LogLevel.DEBUG

  // Prefix for all log messages
  prefix: 'MyApp',

  // Enable/disable colors
  colors: true,

  // Enable/disable timestamps
  timestamps: true,

  // Timestamp format (when timestamps are enabled)
  timestampFormat: 'HH:mm:ss',

  // Show source file information
  showSource: true,

  // Output format (JSON or text)
  json: false,

  // Custom output stream
  output: process.stdout,
});
```

## Common Use Cases

### API Logger

```typescript
import logger from '@calphonse/logger';

const apiLogger = logger.createLogger({
  prefix: 'API',
  level: 'info',
  showSource: true,
});

// In your API routes
apiLogger.info('Request received', {
  method: req.method,
  path: req.path,
  userAgent: req.headers['user-agent'],
});

apiLogger.error('Request failed', {
  statusCode: 500,
  error: error.message,
  path: req.path,
});
```

### Database Logger

```typescript
import logger from '@calphonse/logger';

const dbLogger = logger.createLogger({
  prefix: 'Database',
  level: 'debug',
  showSource: true,
});

// In your database operations
dbLogger.debug('Query executed', {
  query: 'SELECT * FROM users WHERE id = ?',
  params: [userId],
  duration: queryTime,
});

dbLogger.error('Database error', {
  error: error.message,
  query: query,
  params: params,
});
```

### Cache Logger

```typescript
import logger from '@calphonse/logger';

const cacheLogger = logger.createLogger({
  prefix: 'Cache',
  level: 'info',
});

// In your caching logic
cacheLogger.info('Cache miss', {
  key: cacheKey,
  operation: 'GET',
});

cacheLogger.info('Cache hit', {
  key: cacheKey,
  ttl: remainingTTL,
});
```

## Child Loggers

Child loggers inherit configuration from their parent but add a prefix. This is useful for organizing logs by module or component.

### Creating Child Loggers

```typescript
import logger from '@calphonse/logger';

// Create a parent logger
const appLogger = logger.createLogger({
  prefix: 'MyApp',
  level: 'debug',
});

// Create child loggers
const userLogger = appLogger.child('Users');
const orderLogger = appLogger.child('Orders');
const paymentLogger = appLogger.child('Payments');

// Use child loggers
userLogger.info('User created'); // Output: [MyApp] [Users] [INFO] User created
orderLogger.warn('Order expired'); // Output: [MyApp] [Orders] [WARN] Order expired
paymentLogger.error('Payment failed'); // Output: [MyApp] [Payments] [ERROR] Payment failed
```

### Nested Child Loggers

```typescript
import logger from '@calphonse/logger';

const appLogger = logger.createLogger({ prefix: 'MyApp' });
const apiLogger = appLogger.child('API');
const userApiLogger = apiLogger.child('Users');

userApiLogger.info('User API request');
// Output: [MyApp] [API] [Users] [INFO] User API request
```

## Logger Factory Methods

The library provides factory methods for common logger configurations.

### JSON Logger

```typescript
import logger from '@calphonse/logger';

// Create a logger that outputs JSON format
const jsonLogger = logger.createJsonLogger({
  prefix: 'API',
  level: 'info',
});

jsonLogger.info('Request processed', { userId: '123', status: 'success' });
// Output: {"timestamp":"2024-01-15T10:30:00.000Z","level":"INFO","message":"Request processed","data":{"userId":"123","status":"success"}}
```

### Minimal Logger

```typescript
import logger from '@calphonse/logger';

// Create a minimal logger with basic configuration
const minimalLogger = logger.createMinimalLogger({
  prefix: 'Minimal',
});

minimalLogger.info('Simple message');
// Output: [Minimal] [INFO] Simple message
```

### Verbose Logger

```typescript
import logger from '@calphonse/logger';

// Create a verbose logger with all features enabled
const verboseLogger = logger.createVerboseLogger({
  prefix: 'Verbose',
  showSource: true,
});

verboseLogger.debug('Debug message');
// Output: [10:30:00] [Verbose] [app.js:25] [DEBUG] Debug message
```

## Dynamic Configuration

You can change logger configuration at runtime.

### Updating Configuration

```typescript
import logger from '@calphonse/logger';

const customLogger = logger.createLogger({
  prefix: 'Dynamic',
  level: 'info',
});

// Update configuration
customLogger.setConfig({
  level: 'debug',
  colors: false,
  json: true,
});

// Get current configuration
const config = customLogger.getConfig();
console.log('Current config:', config);
```

### Environment-Based Configuration

```typescript
import logger from '@calphonse/logger';

function createLoggerForEnvironment(prefix: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return logger.createLogger({
    prefix,
    level: isProduction ? 'warn' : 'debug',
    colors: !isProduction,
    json: isProduction,
    showSource: isDevelopment,
  });
}

const apiLogger = createLoggerForEnvironment('API');
const dbLogger = createLoggerForEnvironment('Database');
```

## Best Practices

### Naming Conventions

```typescript
// Use descriptive prefixes
const userServiceLogger = logger.createLogger({ prefix: 'UserService' });
const paymentProcessorLogger = logger.createLogger({
  prefix: 'PaymentProcessor',
});
const emailServiceLogger = logger.createLogger({ prefix: 'EmailService' });
```

### Log Level Strategy

```typescript
// Development: Show all logs
const devLogger = logger.createLogger({ level: 'trace' });

// Staging: Show important logs
const stagingLogger = logger.createLogger({ level: 'info' });

// Production: Show only warnings and errors
const prodLogger = logger.createLogger({ level: 'warn' });
```

### Module Organization

```typescript
// user-service.ts
import logger from '@calphonse/logger';

const userLogger = logger.createLogger({ prefix: 'UserService' });

export class UserService {
  async createUser(userData: any) {
    userLogger.info('Creating user', { email: userData.email });
    // ... implementation
  }
}

// payment-service.ts
import logger from '@calphonse/logger';

const paymentLogger = logger.createLogger({ prefix: 'PaymentService' });

export class PaymentService {
  async processPayment(paymentData: any) {
    paymentLogger.info('Processing payment', { amount: paymentData.amount });
    // ... implementation
  }
}
```

This approach gives you fine-grained control over logging in different parts of your application while maintaining consistency and organization.
