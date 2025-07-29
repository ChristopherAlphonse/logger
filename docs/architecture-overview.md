# Architecture Overview

This document provides a comprehensive overview of the enhanced logger library architecture, system design, and component interactions for enterprise applications.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Enhanced Logger Library                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Logger    │  │   Logger    │  │   Logger    │            │
│  │  Instance   │  │  Instance   │  │  Instance   │            │
│  │     A       │  │     B       │  │     C       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          │                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Global Registry                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │ Log Level   │  │   Custom    │  │   Logger    │        ││
│  │  │  Control    │  │  Handlers   │  │ Management  │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Output Layer                                ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │   Console   │  │     File    │  │   External  │        ││
│  │  │   Output    │  │   Output    │  │   Services  │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Application │───▶│   Logger    │───▶│  Formatter  │───▶│   Handler   │
│    Code     │    │  Instance   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   Global    │    │   Log       │    │   Output    │
                   │  Registry   │    │  Entry      │    │  Streams    │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

## Core Components

### 1. Logger Instance

The Logger class is the primary interface for logging operations:

```typescript
class Logger {
  private config: LoggerConfig;
  private handler: LogHandler | null;
  private parent: Logger | null;

  constructor(config?: LoggerConfig) {
    this.config = { ...defaultConfig, ...config };
    this.registerWithGlobalRegistry();
  }

  info(message: string, data?: LogData): void {
    this.log(LogLevel.INFO, message, data);
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    if (!this.isEnabled(level)) return;

    const entry = this.createLogEntry(level, message, data);
    this.processLogEntry(entry);
  }
}
```

**Key Responsibilities:**

- Manage logger configuration
- Handle log level filtering
- Create log entries
- Process log entries through handlers
- Register with global registry

### 2. Global Registry

The Global Registry provides centralized control over all logger instances:

```typescript
class GlobalRegistry {
  private static instance: GlobalRegistry;
  private loggers: Map<string, Logger> = new Map();
  private globalLevel: LogLevel = LogLevel.INFO;
  private globalHandler: LogHandler | null = null;

  static getInstance(): GlobalRegistry {
    if (!GlobalRegistry.instance) {
      GlobalRegistry.instance = new GlobalRegistry();
    }
    return GlobalRegistry.instance;
  }

  registerLogger(logger: Logger): void {
    const key = this.generateLoggerKey(logger);
    this.loggers.set(key, logger);
  }

  setGlobalLevel(level: LogLevel): void {
    this.globalLevel = level;
    this.notifyLoggersOfLevelChange();
  }
}
```

**Key Responsibilities:**

- Track all logger instances
- Manage global log level
- Manage global handlers
- Provide logger discovery
- Coordinate logger lifecycle

### 3. Log Formatter

The LogFormatter handles message formatting and output generation:

```typescript
class LogFormatter {
  formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
    const parts: string[] = [];

    // Add timestamp
    if (config.timestamps) {
      parts.push(this.formatTimestamp(entry.timestamp, config.timestampFormat));
    }

    // Add prefix
    if (entry.prefix) {
      parts.push(`[${entry.prefix}]`);
    }

    // Add source information
    if (config.showSource && entry.source) {
      parts.push(`[${entry.source}]`);
    }

    // Add level
    parts.push(`[${this.formatLevel(entry.level)}]`);

    // Add message
    parts.push(entry.message);

    // Add data
    if (entry.data) {
      parts.push(this.formatData(entry.data, config));
    }

    return parts.join(' ');
  }
}
```

**Key Responsibilities:**

- Format log entries for output
- Handle different output formats (text, JSON)
- Apply configuration options
- Generate structured output

### 4. Custom Handlers

Custom handlers provide extensibility for log processing:

```typescript
type LogHandler = (params: LogCallbackParams) => void;

interface LogCallbackParams {
  level: LogLevelString;
  message: string;
  data?: LogData;
  timestamp: Date;
  source?: string;
  prefix?: string;
  loggerName?: string;
}
```

**Key Responsibilities:**

- Process log entries before output
- Enable external service integration
- Provide custom formatting
- Implement filtering and transformation

## Data Flow Architecture

### 1. Log Entry Creation

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Application │───▶│   Logger    │───▶│  Log Entry  │
│    Call     │    │   Instance  │    │  Creation   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Level Check │
                   └─────────────┘
```

### 2. Log Processing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Log Entry  │───▶│   Global    │───▶│   Custom    │───▶│   Output    │
│  Created    │    │   Registry  │    │  Handler    │    │  Formatter  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │ Level Check │    │  Transform  │    │  Format     │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Output Generation

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Formatted  │───▶│   Output    │───▶│   External  │
│   Message   │    │   Stream    │    │   Target    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Console   │
                   │   File      │
                   │   Network   │
                   └─────────────┘
```

## Configuration Architecture

### Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Configuration Hierarchy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Global Configuration                        │ │
│  │  - Global log level                                         │ │
│  │  - Global handlers                                          │ │
│  │  - Environment settings                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Logger Instance Configuration                   │ │
│  │  - Individual log level                                     │ │
│  │  - Custom handlers                                          │ │
│  │  - Formatting options                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Child Logger Configuration                    │ │
│  │  - Inherits from parent                                     │ │
│  │  - Override specific settings                                │ │
│  │  - Add prefix                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Resolution

```typescript
interface ResolvedConfig {
  level: LogLevel;
  prefix?: string;
  colors: boolean;
  timestamps: boolean;
  timestampFormat: string;
  showSource: boolean;
  json: boolean;
  output: NodeJS.WritableStream;
}

function resolveConfig(
  globalConfig: Partial<LoggerConfig>,
  instanceConfig: Partial<LoggerConfig>,
  childConfig: Partial<LoggerConfig> = {}
): ResolvedConfig {
  return {
    ...defaultConfig,
    ...globalConfig,
    ...instanceConfig,
    ...childConfig,
  };
}
```

## Performance Architecture

### 1. Lazy Evaluation

```typescript
// Performance optimization through lazy evaluation
logger.debug('Expensive data', () => computeExpensiveData());

// Implementation
private log(level: LogLevel, message: string, data?: LogData | (() => LogData)): void {
  if (!this.isEnabled(level)) return;

  const resolvedData = typeof data === 'function' ? data() : data;
  const entry = this.createLogEntry(level, message, resolvedData);
  this.processLogEntry(entry);
}
```

### 2. Conditional Logging

```typescript
// Performance optimization through conditional checks
if (logger.isEnabled(LogLevel.DEBUG)) {
  const expensiveData = computeExpensiveData();
  logger.debug('Expensive data', expensiveData);
}
```

### 3. Batch Processing

```typescript
// Performance optimization through batching
class BatchLogger {
  private buffer: LogEntry[] = [];
  private bufferSize: number;
  private flushInterval: number;

  constructor(bufferSize = 100, flushInterval = 5000) {
    this.bufferSize = bufferSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }

  addLog(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }
}
```

## Security Architecture

### 1. Data Sanitization

```typescript
class SecurityManager {
  private sensitiveFields: string[];

  constructor(sensitiveFields: string[] = []) {
    this.sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'ssn',
      'creditCard',
      ...sensitiveFields,
    ];
  }

  sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }
}
```

### 2. Access Control

```typescript
class AccessControl {
  private allowedLevels: Set<LogLevel>;
  private allowedHandlers: Set<string>;

  constructor(allowedLevels: LogLevel[], allowedHandlers: string[]) {
    this.allowedLevels = new Set(allowedLevels);
    this.allowedHandlers = new Set(allowedHandlers);
  }

  canLog(level: LogLevel): boolean {
    return this.allowedLevels.has(level);
  }

  canUseHandler(handlerName: string): boolean {
    return this.allowedHandlers.has(handlerName);
  }
}
```

## Scalability Architecture

### 1. Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                    Horizontal Scaling                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Service   │    │   Service   │    │   Service   │        │
│  │   Instance  │    │   Instance  │    │   Instance  │        │
│  │      A      │    │      B      │    │      C      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             │                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Centralized Logging                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │   Log       │  │   Log       │  │   Log       │        ││
│  │  │ Aggregator  │  │ Processor   │  │ Storage     │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2. Load Balancing

```typescript
class LoadBalancedLogger {
  private handlers: LogHandler[];
  private currentIndex: number = 0;

  constructor(handlers: LogHandler[]) {
    this.handlers = handlers;
  }

  handleLog(params: LogCallbackParams): void {
    const handler = this.handlers[this.currentIndex];
    handler(params);

    // Round-robin load balancing
    this.currentIndex = (this.currentIndex + 1) % this.handlers.length;
  }
}
```

## Monitoring Architecture

### 1. Health Checks

```typescript
class LoggerHealthMonitor {
  private metrics: {
    totalLogs: number;
    errors: number;
    averageLatency: number;
    memoryUsage: number;
  } = {
    totalLogs: 0,
    errors: 0,
    averageLatency: 0,
    memoryUsage: 0,
  };

  recordLog(duration: number, success: boolean): void {
    this.metrics.totalLogs++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalLogs - 1) + duration) /
      this.metrics.totalLogs;

    if (!success) {
      this.metrics.errors++;
    }
  }

  getHealthStatus(): HealthStatus {
    return {
      healthy: this.metrics.errors / this.metrics.totalLogs < 0.01,
      metrics: { ...this.metrics },
    };
  }
}
```

### 2. Performance Monitoring

```typescript
class PerformanceMonitor {
  private startTime: bigint;

  startTimer(): void {
    this.startTime = process.hrtime.bigint();
  }

  endTimer(): number {
    const endTime = process.hrtime.bigint();
    return Number(endTime - this.startTime) / 1000000; // Convert to milliseconds
  }

  monitorLogging<T>(operation: () => T): T {
    this.startTimer();
    try {
      const result = operation();
      const duration = this.endTimer();
      this.recordSuccess(duration);
      return result;
    } catch (error) {
      const duration = this.endTimer();
      this.recordError(duration, error);
      throw error;
    }
  }
}
```

## Deployment Architecture

### 1. Container Deployment

```dockerfile
# Dockerfile for logger service
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 2. Kubernetes Deployment

```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logger-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: logger-service
  template:
    metadata:
      labels:
        app: logger-service
    spec:
      containers:
        - name: logger-service
          image: logger-service:latest
          env:
            - name: NODE_ENV
              value: 'production'
            - name: LOG_LEVEL
              value: 'info'
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: '128Mi'
              cpu: '100m'
            limits:
              memory: '256Mi'
              cpu: '200m'
```

This architecture overview provides a comprehensive understanding of the enhanced logger library's design, components, and interactions for enterprise applications.
