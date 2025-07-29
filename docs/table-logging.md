# Table Logging

The table logging feature allows you to display structured data in a formatted, easy-to-read table format. This is perfect for logging configuration data, performance metrics, user information, and any structured data that benefits from tabular display.

## Basic Table Logging

### Simple Array of Objects

```typescript
import logger from '@calphonse/logger';

const users = [
  { name: 'Alice', age: 28, role: 'Engineer', salary: 85000 },
  { name: 'Bob', age: 34, role: 'Designer', salary: 72000 },
  { name: 'Charlie', age: 29, role: 'Manager', salary: 95000 },
  { name: 'Diana', age: 31, role: 'Developer', salary: 78000 },
];

logger.table(users);
```

Output:

```
+---------+-----+-----------+--------+
| name    | age | role      | salary |
+---------+-----+-----------+--------+
| Alice   | 28  | Engineer  | 85000  |
| Bob     | 34  | Designer  | 72000  |
| Charlie | 29  | Manager   | 95000  |
| Diana   | 31  | Developer | 78000  |
+---------+-----+-----------+--------+
```

### Single Object (Key-Value Pairs)

```typescript
import logger from '@calphonse/logger';

const cacheInfo = {
  'Cache Operation': 'GET',
  'Cache Tags': 'user, profile',
  'Revalidate (s)': 3600,
  Timestamp: new Date().toISOString(),
};

logger.table(cacheInfo);
```

Output:

```
+-----------------+---------------+----------------+--------------------------+
| Cache Operation | Cache Tags    | Revalidate (s) | Timestamp                |
+-----------------+---------------+----------------+--------------------------+
| GET             | user, profile | 3600           | 2024-01-15T10:30:00.000Z |
+-----------------+---------------+----------------+--------------------------+
```

## Advanced Table Options

### Custom Headers

```typescript
import logger from '@calphonse/logger';

const data = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
];

logger.table(data, {
  headers: ['Person', 'Years', 'Job'],
});
```

Output:

```
+--------+-------+-----+
| Person | Years | Job |
+--------+-------+-----+
| Alice  | 28    | Engineer |
| Bob    | 34    | Designer |
+--------+-------+-----+
```

### Disable Borders

```typescript
import logger from '@calphonse/logger';

const data = [
  { name: 'Alice', age: 28 },
  { name: 'Bob', age: 34 },
];

logger.table(data, { border: false });
```

Output:

```
name   age
Alice  28
Bob    34
```

### With Log Level

```typescript
import logger, { LogLevel } from '@calphonse/logger';

const performanceData = [
  { operation: 'Database Query', duration: 150, status: 'success' },
  { operation: 'API Call', duration: 300, status: 'success' },
  { operation: 'File Read', duration: 50, status: 'success' },
];

// Log table at debug level
logger.table(LogLevel.DEBUG, performanceData);
```

## Real-World Use Cases

### Configuration Logging

```typescript
import logger from '@calphonse/logger';

function logApplicationConfig() {
  const config = {
    Environment: process.env.NODE_ENV,
    Port: process.env.PORT || 3000,
    'Database URL': process.env.DATABASE_URL,
    'Log Level': process.env.LOG_LEVEL || 'info',
    'Node Version': process.version,
  };

  logger.table(config);
}
```

### Performance Metrics

```typescript
import logger from '@calphonse/logger';

function logPerformanceMetrics(metrics: any[]) {
  const performanceData = metrics.map(metric => ({
    Operation: metric.name,
    'Duration (ms)': metric.duration,
    'Memory (MB)': Math.round(metric.memory / 1024 / 1024),
    Status: metric.status,
  }));

  logger.table(performanceData);
}

// Usage
const metrics = [
  {
    name: 'Database Query',
    duration: 150,
    memory: 52428800,
    status: 'success',
  },
  { name: 'API Request', duration: 300, memory: 104857600, status: 'success' },
  {
    name: 'File Processing',
    duration: 50,
    memory: 26214400,
    status: 'success',
  },
];

logPerformanceMetrics(metrics);
```

### User Session Data

```typescript
import logger from '@calphonse/logger';

function logUserSessions(sessions: any[]) {
  const sessionData = sessions.map(session => ({
    'User ID': session.userId,
    'Session ID': session.sessionId,
    'Login Time': new Date(session.loginTime).toLocaleString(),
    'Last Activity': new Date(session.lastActivity).toLocaleString(),
    Status: session.status,
  }));

  logger.table(sessionData);
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

// Usage
logCacheInfo('GET', ['user', 'profile'], 3600);
logCacheInfo('SET', ['product', 'inventory'], 1800);
logCacheInfo('DELETE', ['session'], undefined);
```

## Table Formatting Features

### Automatic Column Width

The table automatically adjusts column widths based on content:

```typescript
import logger from '@calphonse/logger';

const data = [
  {
    short: 'A',
    medium: 'Medium text',
    long: 'This is a very long text that will wrap',
  },
  {
    short: 'B',
    medium: 'Another',
    long: 'Another long text for demonstration',
  },
];

logger.table(data);
```

### Handling Different Data Types

```typescript
import logger from '@calphonse/logger';

const mixedData = {
  'String Value': 'Hello World',
  'Number Value': 42,
  'Boolean Value': true,
  'Undefined Value': undefined,
  'Null Value': null,
  'Date Value': new Date(),
  'Object Value': JSON.stringify({ nested: 'data' }),
  'Array Value': JSON.stringify([1, 2, 3]),
};

logger.table(mixedData);
```

### Nested Data Handling

```typescript
import logger from '@calphonse/logger';

const complexData = [
  {
    name: 'Alice',
    details: JSON.stringify({ department: 'Engineering', level: 'Senior' }),
    skills: JSON.stringify(['JavaScript', 'TypeScript', 'React']),
  },
  {
    name: 'Bob',
    details: JSON.stringify({ department: 'Design', level: 'Lead' }),
    skills: JSON.stringify(['Figma', 'Sketch', 'Adobe']),
  },
];

logger.table(complexData);
```

## Custom Logger Tables

### With Custom Logger

```typescript
import logger from '@calphonse/logger';

const apiLogger = logger.createLogger({ prefix: 'API' });

const requestData = [
  { method: 'GET', path: '/users', status: 200, duration: 150 },
  { method: 'POST', path: '/users', status: 201, duration: 200 },
  { method: 'PUT', path: '/users/123', status: 200, duration: 180 },
];

apiLogger.table(requestData);
```

Output:

```
[API] +--------+-------------+--------+----------+
[API] | method | path        | status | duration |
[API] +--------+-------------+--------+----------+
[API] | GET    | /users      | 200    | 150      |
[API] | POST   | /users      | 201    | 200      |
[API] | PUT    | /users/123  | 200    | 180      |
[API] +--------+-------------+--------+----------+
```

### Child Logger Tables

```typescript
import logger from '@calphonse/logger';

const appLogger = logger.createLogger({ prefix: 'MyApp' });
const dbLogger = appLogger.child('Database');

const queryData = [
  { query: 'SELECT * FROM users', duration: 50, rows: 100 },
  { query: 'INSERT INTO logs', duration: 25, rows: 1 },
  { query: 'UPDATE settings', duration: 30, rows: 5 },
];

dbLogger.table(queryData);
```

Output:

```
[MyApp] [Database] +-------------------+----------+------+
[MyApp] [Database] | query             | duration | rows |
[MyApp] [Database] +-------------------+----------+------+
[MyApp] [Database] | SELECT * FROM users | 50       | 100  |
[MyApp] [Database] | INSERT INTO logs   | 25       | 1    |
[MyApp] [Database] | UPDATE settings    | 30       | 5    |
[MyApp] [Database] +-------------------+----------+------+
```

## Best Practices

### Use for Structured Data

```typescript
import logger from '@calphonse/logger';

// Good: Structured data that benefits from tabular display
const userList = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];
logger.table(userList);

// Avoid: Simple key-value pairs that don't need tabular format
logger.info('User created', { id: 1, name: 'Alice' });
```

### Consistent Data Structure

```typescript
import logger from '@calphonse/logger';

// Ensure all objects have the same keys
const consistentData = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
  { name: 'Charlie', age: 29, role: 'Manager' },
];

logger.table(consistentData);
```

### Meaningful Headers

```typescript
import logger from '@calphonse/logger';

const data = [
  { n: 'Alice', a: 28, r: 'Engineer' },
  { n: 'Bob', a: 34, r: 'Designer' },
];

// Use custom headers for better readability
logger.table(data, {
  headers: ['Name', 'Age', 'Role'],
});
```

### Environment Considerations

```typescript
import logger from '@calphonse/logger';

function logTableData(data: any[], options?: any) {
  // In production, you might want to log as JSON instead
  if (process.env.NODE_ENV === 'production') {
    logger.info('Table data', { data, options });
  } else {
    logger.table(data, options);
  }
}
```

Table logging is perfect for displaying structured data in a human-readable format, making it easier to understand complex information at a glance.
