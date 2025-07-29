# Enterprise Integrations

This guide covers enterprise-grade integrations, compliance considerations, and advanced logging patterns for large-scale applications.

## ELK Stack Integration

### Elasticsearch Integration

```typescript
import logger from '@calphonse/logger';

// Elasticsearch handler
class ElasticsearchHandler {
  private client: any;
  private index: string;

  constructor(elasticsearchUrl: string, index: string) {
    this.index = index;
    // Initialize Elasticsearch client
    this.client = new (require('@elastic/elasticsearch').Client)({
      node: elasticsearchUrl,
    });
  }

  async handleLog(params: any) {
    try {
      await this.client.index({
        index: this.index,
        body: {
          timestamp: params.timestamp,
          level: params.level,
          message: params.message,
          logger: params.loggerName,
          data: params.data,
          environment: process.env.NODE_ENV,
          hostname: require('os').hostname(),
          pid: process.pid,
        },
      });
    } catch (error) {
      console.error('Failed to send log to Elasticsearch:', error);
    }
  }
}

// Usage
const esHandler = new ElasticsearchHandler('http://localhost:9200', 'app-logs');
const esLogger = logger.createLogger({ prefix: 'ES' });
esLogger.setHandler(params => esHandler.handleLog(params));
```

### Logstash Integration

```typescript
import logger from '@calphonse/logger';

// Logstash handler with structured data
class LogstashHandler {
  private logstashUrl: string;

  constructor(logstashUrl: string) {
    this.logstashUrl = logstashUrl;
  }

  async handleLog(params: any) {
    const logEntry = {
      '@timestamp': params.timestamp.toISOString(),
      '@version': '1',
      level: params.level.toUpperCase(),
      message: params.message,
      logger: params.loggerName,
      environment: process.env.NODE_ENV,
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.APP_VERSION || 'unknown',
      ...params.data,
    };

    try {
      await fetch(this.logstashUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log to Logstash:', error);
    }
  }
}

// Usage
const logstashHandler = new LogstashHandler('http://localhost:5000');
const logstashLogger = logger.createLogger({ prefix: 'Logstash' });
logstashLogger.setHandler(params => logstashHandler.handleLog(params));
```

### Kibana Dashboard Configuration

```typescript
import logger from '@calphonse/logger';

// Enhanced logging for Kibana dashboards
class KibanaOptimizedLogger {
  private logger: any;

  constructor(prefix: string) {
    this.logger = logger.createLogger({
      prefix,
      json: true, // JSON format for better Kibana parsing
    });
  }

  // Structured logging for metrics
  logMetric(
    metricName: string,
    value: number,
    tags: Record<string, string> = {}
  ) {
    this.logger.info('Metric recorded', {
      metric_name: metricName,
      metric_value: value,
      metric_type: 'gauge',
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  // Structured logging for events
  logEvent(eventName: string, eventData: any, severity: string = 'info') {
    this.logger[severity]('Event occurred', {
      event_name: eventName,
      event_data: eventData,
      event_type: 'business_event',
      timestamp: new Date().toISOString(),
    });
  }

  // Structured logging for errors
  logError(error: Error, context: any = {}) {
    this.logger.error('Error occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Usage
const kibanaLogger = new KibanaOptimizedLogger('Kibana');
kibanaLogger.logMetric('api_response_time', 150, {
  endpoint: '/users',
  method: 'GET',
});
kibanaLogger.logEvent('user_registered', {
  userId: '123',
  email: 'user@example.com',
});
```

## Splunk Integration

### Splunk HTTP Event Collector

```typescript
import logger from '@calphonse/logger';

class SplunkHandler {
  private splunkUrl: string;
  private token: string;
  private source: string;

  constructor(splunkUrl: string, token: string, source: string) {
    this.splunkUrl = splunkUrl;
    this.token = token;
    this.source = source;
  }

  async handleLog(params: any) {
    const splunkEvent = {
      event: {
        message: params.message,
        level: params.level,
        logger: params.loggerName,
        data: params.data,
        environment: process.env.NODE_ENV,
        host: require('os').hostname(),
        timestamp: params.timestamp.toISOString(),
      },
      source: this.source,
      sourcetype: 'json',
      host: require('os').hostname(),
    };

    try {
      await fetch(`${this.splunkUrl}/services/collector`, {
        method: 'POST',
        headers: {
          Authorization: `Splunk ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(splunkEvent),
      });
    } catch (error) {
      console.error('Failed to send log to Splunk:', error);
    }
  }
}

// Usage
const splunkHandler = new SplunkHandler(
  'https://splunk.company.com:8088',
  'your-splunk-token',
  'my-application'
);
const splunkLogger = logger.createLogger({ prefix: 'Splunk' });
splunkLogger.setHandler(params => splunkHandler.handleLog(params));
```

## Cloud Logging Services

### AWS CloudWatch Integration

```typescript
import logger from '@calphonse/logger';

class CloudWatchHandler {
  private cloudWatchLogs: any;
  private logGroupName: string;
  private logStreamName: string;
  private sequenceToken: string | undefined;

  constructor(logGroupName: string, logStreamName: string) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;

    // Initialize AWS CloudWatch Logs client
    const AWS = require('aws-sdk');
    this.cloudWatchLogs = new AWS.CloudWatchLogs({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async handleLog(params: any) {
    const logEvent = {
      timestamp: params.timestamp.getTime(),
      message: JSON.stringify({
        level: params.level,
        message: params.message,
        logger: params.loggerName,
        data: params.data,
        environment: process.env.NODE_ENV,
      }),
    };

    try {
      const putLogEventsParams: any = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
      };

      if (this.sequenceToken) {
        putLogEventsParams.sequenceToken = this.sequenceToken;
      }

      const result = await this.cloudWatchLogs
        .putLogEvents(putLogEventsParams)
        .promise();
      this.sequenceToken = result.nextSequenceToken;
    } catch (error) {
      console.error('Failed to send log to CloudWatch:', error);
    }
  }
}

// Usage
const cloudWatchHandler = new CloudWatchHandler(
  '/my-app/production',
  'app-logs'
);
const cloudWatchLogger = logger.createLogger({ prefix: 'CloudWatch' });
cloudWatchLogger.setHandler(params => cloudWatchHandler.handleLog(params));
```

### Azure Monitor Integration

```typescript
import logger from '@calphonse/logger';

class AzureMonitorHandler {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async handleLog(params: any) {
    const telemetryData = {
      name: 'CustomLog',
      time: params.timestamp.toISOString(),
      data: {
        baseType: 'MessageData',
        baseData: {
          message: params.message,
          level: params.level,
          logger: params.loggerName,
          properties: {
            ...params.data,
            environment: process.env.NODE_ENV,
          },
        },
      },
    };

    try {
      // Send to Azure Application Insights
      await fetch('https://dc.services.visualstudio.com/v2/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.connectionString}`,
        },
        body: JSON.stringify(telemetryData),
      });
    } catch (error) {
      console.error('Failed to send log to Azure Monitor:', error);
    }
  }
}

// Usage
const azureHandler = new AzureMonitorHandler('your-connection-string');
const azureLogger = logger.createLogger({ prefix: 'Azure' });
azureLogger.setHandler(params => azureHandler.handleLog(params));
```

### Google Cloud Logging

```typescript
import logger from '@calphonse/logger';

class GoogleCloudLoggingHandler {
  private logging: any;
  private logName: string;

  constructor(projectId: string, logName: string) {
    this.logName = logName;

    // Initialize Google Cloud Logging
    const { Logging } = require('@google-cloud/logging');
    this.logging = new Logging({ projectId });
  }

  async handleLog(params: any) {
    const log = this.logging.log(this.logName);

    const metadata = {
      severity: this.mapLevelToSeverity(params.level),
      resource: {
        type: 'global',
        labels: {
          project_id: process.env.GOOGLE_CLOUD_PROJECT,
        },
      },
      labels: {
        logger: params.loggerName,
        environment: process.env.NODE_ENV,
      },
    };

    const entry = log.entry(metadata, {
      message: params.message,
      data: params.data,
      timestamp: params.timestamp.toISOString(),
    });

    try {
      await log.write(entry);
    } catch (error) {
      console.error('Failed to send log to Google Cloud:', error);
    }
  }

  private mapLevelToSeverity(level: string): string {
    const severityMap: Record<string, string> = {
      error: 'ERROR',
      warn: 'WARNING',
      info: 'INFO',
      debug: 'DEBUG',
      trace: 'DEBUG',
    };
    return severityMap[level] || 'INFO';
  }
}

// Usage
const gcpHandler = new GoogleCloudLoggingHandler('my-project', 'app-logs');
const gcpLogger = logger.createLogger({ prefix: 'GCP' });
gcpLogger.setHandler(params => gcpHandler.handleLog(params));
```

## Compliance and Security

### GDPR Compliance

```typescript
import logger from '@calphonse/logger';

class GDPRCompliantLogger {
  private logger: any;
  private sensitiveFields: string[];

  constructor(prefix: string, sensitiveFields: string[] = []) {
    this.logger = logger.createLogger({ prefix });
    this.sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'ssn',
      'creditCard',
      'email',
      'phone',
      'address',
      ...sensitiveFields,
    ];
  }

  // Sanitize sensitive data
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (
        this.sensitiveFields.some(field =>
          key.toLowerCase().includes(field.toLowerCase())
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  // Log with data retention policy
  logWithRetention(
    level: string,
    message: string,
    data?: any,
    retentionDays: number = 30
  ) {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;

    this.logger[level](message, {
      ...sanitizedData,
      retention_days: retentionDays,
      gdpr_compliant: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Log user consent
  logUserConsent(userId: string, consentType: string, granted: boolean) {
    this.logger.info('User consent updated', {
      user_id: userId,
      consent_type: consentType,
      consent_granted: granted,
      timestamp: new Date().toISOString(),
      gdpr_compliant: true,
    });
  }

  // Log data deletion request
  logDataDeletionRequest(userId: string, requestId: string) {
    this.logger.info('Data deletion request received', {
      user_id: userId,
      request_id: requestId,
      timestamp: new Date().toISOString(),
      gdpr_compliant: true,
    });
  }
}

// Usage
const gdprLogger = new GDPRCompliantLogger('GDPR', ['customField']);
gdprLogger.logWithRetention(
  'info',
  'User action',
  {
    userId: '123',
    email: 'user@example.com',
    action: 'login',
  },
  90
);
```

### SOX Compliance

```typescript
import logger from '@calphonse/logger';

class SOXCompliantLogger {
  private logger: any;

  constructor(prefix: string) {
    this.logger = logger.createLogger({
      prefix,
      json: true,
      timestamps: true,
    });
  }

  // Log financial transactions
  logFinancialTransaction(
    transactionId: string,
    amount: number,
    currency: string,
    accountId: string,
    transactionType: string
  ) {
    this.logger.info('Financial transaction processed', {
      transaction_id: transactionId,
      amount,
      currency,
      account_id: accountId,
      transaction_type: transactionType,
      timestamp: new Date().toISOString(),
      sox_compliant: true,
      audit_trail: true,
    });
  }

  // Log access to sensitive data
  logDataAccess(
    userId: string,
    dataType: string,
    accessType: 'read' | 'write' | 'delete',
    resourceId: string
  ) {
    this.logger.info('Data access logged', {
      user_id: userId,
      data_type: dataType,
      access_type: accessType,
      resource_id: resourceId,
      timestamp: new Date().toISOString(),
      sox_compliant: true,
      audit_trail: true,
    });
  }

  // Log system changes
  logSystemChange(
    changeType: string,
    changeDescription: string,
    changedBy: string,
    changeDetails: any
  ) {
    this.logger.info('System change made', {
      change_type: changeType,
      change_description: changeDescription,
      changed_by: changedBy,
      change_details: changeDetails,
      timestamp: new Date().toISOString(),
      sox_compliant: true,
      audit_trail: true,
    });
  }
}

// Usage
const soxLogger = new SOXCompliantLogger('SOX');
soxLogger.logFinancialTransaction(
  'txn_123',
  1000.0,
  'USD',
  'acc_456',
  'deposit'
);
soxLogger.logDataAccess('user_789', 'financial_records', 'read', 'record_123');
```

## Microservices Logging

### Distributed Tracing

```typescript
import logger from '@calphonse/logger';

class DistributedTracingLogger {
  private logger: any;

  constructor(prefix: string) {
    this.logger = logger.createLogger({ prefix });
  }

  // Log with correlation ID for distributed tracing
  logWithCorrelation(
    level: string,
    message: string,
    correlationId: string,
    serviceName: string,
    data?: any
  ) {
    this.logger[level](message, {
      correlation_id: correlationId,
      service_name: serviceName,
      trace_id: correlationId,
      span_id: this.generateSpanId(),
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Log service communication
  logServiceCall(
    fromService: string,
    toService: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    correlationId: string
  ) {
    this.logger.info('Service call made', {
      from_service: fromService,
      to_service: toService,
      endpoint,
      method,
      status_code: statusCode,
      duration_ms: duration,
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
    });
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Usage
const tracingLogger = new DistributedTracingLogger('Tracing');
tracingLogger.logWithCorrelation(
  'info',
  'Processing request',
  'corr_123',
  'user-service',
  {
    userId: 'user_456',
    action: 'get_profile',
  }
);
```

### Circuit Breaker Logging

```typescript
import logger from '@calphonse/logger';

class CircuitBreakerLogger {
  private logger: any;

  constructor(prefix: string) {
    this.logger = logger.createLogger({ prefix });
  }

  // Log circuit breaker state changes
  logCircuitBreakerState(
    serviceName: string,
    state: 'closed' | 'open' | 'half-open',
    failureCount: number,
    threshold: number
  ) {
    this.logger.warn('Circuit breaker state changed', {
      service_name: serviceName,
      state,
      failure_count: failureCount,
      threshold,
      timestamp: new Date().toISOString(),
    });
  }

  // Log service failures
  logServiceFailure(
    serviceName: string,
    endpoint: string,
    error: string,
    failureCount: number
  ) {
    this.logger.error('Service call failed', {
      service_name: serviceName,
      endpoint,
      error,
      failure_count: failureCount,
      timestamp: new Date().toISOString(),
    });
  }
}

// Usage
const circuitLogger = new CircuitBreakerLogger('CircuitBreaker');
circuitLogger.logCircuitBreakerState('payment-service', 'open', 5, 3);
```

## Best Practices

### Enterprise Logging Checklist

- [ ] Implement structured logging with consistent schema
- [ ] Use correlation IDs for distributed tracing
- [ ] Sanitize sensitive data before logging
- [ ] Implement log retention policies
- [ ] Use appropriate log levels for different environments
- [ ] Monitor logging performance and costs
- [ ] Implement fallback mechanisms for external services
- [ ] Use JSON format for better parsing
- [ ] Include environment and service metadata
- [ ] Implement audit trails for compliance

### Security Considerations

- [ ] Never log passwords, tokens, or secrets
- [ ] Implement data masking for sensitive fields
- [ ] Use secure connections for external logging services
- [ ] Implement access controls for log data
- [ ] Regular security audits of logging systems
- [ ] Compliance with data protection regulations

This enterprise integration guide provides comprehensive patterns for integrating with enterprise logging systems while maintaining security and compliance requirements.
