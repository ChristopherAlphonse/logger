# Enhanced Logger Documentation

Welcome to the comprehensive documentation for the enhanced logger library. This library provides a powerful, flexible logging solution for Node.js applications with features like global registry management, custom handlers, table logging, and more.

## Quick Navigation

- **[Getting Started](./getting-started.md)** - Installation and basic usage
- **[Custom Loggers](./custom-loggers.md)** - Creating and configuring custom logger instances
- **[Global Registry](./global-registry.md)** - Centralized control of all loggers
- **[Table Logging](./table-logging.md)** - Displaying structured data in table format
- **[Advanced Features](./advanced-features.md)** - Enterprise features and use cases
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Troubleshooting](./troubleshooting.md)** - Common issues and debugging guide
- **[Performance Guide](./performance-guide.md)** - Performance optimization and benchmarks
- **[Enterprise Integrations](./enterprise-integrations.md)** - ELK Stack, Splunk, cloud services
- **[Migration Guide](./migration-guide.md)** - Migrate from other logging libraries
- **[Architecture Overview](./architecture-overview.md)** - System design and components

## Features Overview

### Core Features

- **Multiple Log Levels**: `error`, `warn`, `info`, `debug`, `trace`, `silent`
- **String and Enum Support**: Use string-based levels for easier configuration
- **Colored Output**: Beautiful, colored console output with chalk
- **Structured Data**: Log additional data objects with your messages
- **Timestamps**: Optional timestamp formatting
- **Source Information**: Show file and line information for debugging

### Advanced Features

- **Global Registry**: Centralized control of all logger instances
- **Custom Handlers**: Intercept and process log messages
- **Table Logging**: Display structured data in formatted tables
- **Child Loggers**: Create hierarchical logger instances
- **Factory Methods**: Pre-configured logger types
- **Environment Management**: Easy switching between dev/prod/test modes

### Enterprise Features

- **External Service Integration**: Send logs to monitoring services
- **File Logging**: Log to files with custom handlers
- **Performance Optimization**: Conditional logging and lazy evaluation
- **Security**: Sensitive data filtering and appropriate log levels
- **Testing Support**: Capture logs for assertions
- **Compliance**: GDPR and SOX compliance features
- **Distributed Tracing**: Correlation IDs for microservices
- **High Availability**: Load balancing and failover support

## Quick Start

```typescript
import logger from '@calphonse/logger';

// Basic logging
logger.info('Application started');
logger.error('Database connection failed', { errorCode: 'DB001' });

// Create custom logger
const apiLogger = logger.createLogger({ prefix: 'API' });
apiLogger.info('API server started');

// Global control
import { setGlobalLogLevel } from '@calphonse/logger';
setGlobalLogLevel('warn'); // Only show warnings and errors

// Table logging
const users = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
];
logger.table(users);
```

## Installation

```bash
npm install @calphonse/logger
# or
yarn add @calphonse/logger
# or
pnpm add @calphonse/logger
```

## Key Concepts

### Log Levels

The logger supports five standard log levels plus a silent mode:

- `error` - Critical errors that need immediate attention
- `warn` - Warnings that should be investigated
- `info` - General information about application flow
- `debug` - Detailed debugging information
- `trace` - Very detailed tracing information
- `silent` - Suppress all log output

### Global Registry

The global registry automatically tracks all logger instances and provides centralized control:

- Set log levels for all loggers at once
- Apply custom handlers globally
- Find and manage logger instances
- Environment-based configuration

### Custom Handlers

Custom handlers allow you to intercept log messages before they are output:

- Send logs to external services
- Write to files
- Apply custom formatting
- Filter sensitive data
- Integrate with monitoring systems

### Table Logging

Display structured data in easy-to-read table format:

- Arrays of objects
- Single objects (key-value pairs)
- Custom headers and borders
- Automatic column width adjustment
- Support for different data types

## Use Cases

### Development

```typescript
// Show all logs with source information
logger.setLevel('debug');
logger.setConfig({ showSource: true });
```

### Production

```typescript
// Only show warnings and errors, send to monitoring service
setGlobalLogLevel('warn');
setGlobalLogHandler(sendToMonitoringService);
```

### Testing

```typescript
// Capture logs for assertions
const testLogs = [];
setGlobalLogHandler(params => testLogs.push(params));
```

### Enterprise

```typescript
// GDPR compliant logging with data retention
const gdprLogger = new GDPRCompliantLogger('GDPR');
gdprLogger.logWithRetention(
  'info',
  'User action',
  {
    userId: '123',
    action: 'login',
  },
  90
);

// Distributed tracing for microservices
const tracingLogger = new DistributedTracingLogger('Tracing');
tracingLogger.logWithCorrelation(
  'info',
  'Processing request',
  'corr_123',
  'user-service'
);
```

## Examples

### Express.js Middleware

```typescript
import logger from '@calphonse/logger';

const apiLogger = logger.createLogger({ prefix: 'API' });

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    apiLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
    });
  });

  next();
});
```

### Database Operations

```typescript
import logger from '@calphonse/logger';

const dbLogger = logger.createLogger({ prefix: 'Database' });

async function executeQuery(query: string, params: any[]) {
  const startTime = Date.now();

  try {
    const result = await database.query(query, params);
    dbLogger.debug('Query executed', {
      query,
      params,
      duration: Date.now() - startTime,
    });
    return result;
  } catch (error) {
    dbLogger.error('Query failed', {
      query,
      params,
      error: error.message,
    });
    throw error;
  }
}
```

### Cache Operations

```typescript
import logger from '@calphonse/logger';

function logCacheInfo(operation: string, tags?: string[], revalidate?: number) {
  const tableData = {
    'Cache Operation': operation,
    'Cache Tags': tags ? tags.join(', ') : undefined,
    'Revalidate (s)': revalidate,
    Timestamp: new Date().toISOString(),
  };

  logger.table(tableData);
}
```

### Enterprise Monitoring

```typescript
import logger from '@calphonse/logger';

// ELK Stack integration
const elasticsearchHandler = new ElasticsearchHandler(
  'http://localhost:9200',
  'app-logs'
);
const esLogger = logger.createLogger({ prefix: 'ES' });
esLogger.setHandler(params => elasticsearchHandler.handleLog(params));

// Splunk integration
const splunkHandler = new SplunkHandler(
  'https://splunk.company.com:8088',
  'token',
  'my-app'
);
const splunkLogger = logger.createLogger({ prefix: 'Splunk' });
splunkLogger.setHandler(params => splunkHandler.handleLog(params));
```

## Performance

The enhanced logger is designed for high performance:

- **Basic logging**: ~0.01ms per log (100,000 logs/second)
- **With data objects**: ~0.02ms per log (50,000 logs/second)
- **With custom handlers**: ~0.05ms per log (20,000 logs/second)
- **JSON format**: ~0.03ms per log (33,000 logs/second)

See the [Performance Guide](./performance-guide.md) for optimization strategies and benchmarks.

## Enterprise Readiness

### Compliance Features

- **GDPR Compliance**: Data sanitization and retention policies
- **SOX Compliance**: Audit trails and financial transaction logging
- **Security**: Sensitive data filtering and access controls
- **Monitoring**: Integration with enterprise monitoring systems

### Scalability

- **Horizontal Scaling**: Support for distributed logging
- **Load Balancing**: Round-robin handler distribution
- **High Availability**: Failover and redundancy support
- **Performance Monitoring**: Built-in metrics and health checks

### Integration Support

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Splunk**: HTTP Event Collector integration
- **Cloud Services**: AWS CloudWatch, Azure Monitor, Google Cloud Logging
- **Microservices**: Distributed tracing and correlation IDs

## Migration Guide

If you're migrating from another logging library, we provide comprehensive migration guides:

- **Winston**: Complete transport and configuration migration
- **Pino**: Performance-focused migration patterns
- **Bunyan**: Structured logging migration
- **Debug**: Simple debug-style logging
- **Console.log**: Basic console replacement

See the [Migration Guide](./migration-guide.md) for detailed instructions.

## Troubleshooting

Common issues and solutions:

- **Log levels not working**: Check global vs individual settings
- **Custom handlers not working**: Verify handler registration
- **Performance issues**: Use conditional logging and lazy evaluation
- **Memory leaks**: Monitor logger instance count

See the [Troubleshooting Guide](./troubleshooting.md) for comprehensive debugging help.

## Contributing

We welcome contributions! Please see the main repository for contribution guidelines.

## License

MIT License - see the main repository for details.

---

Start with the [Getting Started](./getting-started.md) guide to learn the basics, then explore the other sections to discover advanced features and enterprise capabilities. For enterprise deployments, review the [Architecture Overview](./architecture-overview.md) and [Enterprise Integrations](./enterprise-integrations.md) guides.
