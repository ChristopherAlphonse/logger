#!/usr/bin/env node

/**
 * Error Handling Demo
 * Shows how to use the logger for different types of errors and scenarios
 */

import { logger } from '../src/index';

const demoLogger = logger.child('[error-demo]');

async function demonstrateErrorHandling() {
  demoLogger.info('=== Logger Error Handling Demo ===');

  demoLogger.info('1. Basic error logging');

  try {
    throw new Error('Something went wrong');
  } catch (error) {
    demoLogger.error('Caught an error', {
      error: error.message,
      stack: error.stack,
    });
  }

  demoLogger.info('2. Structured error logging with context');

  try {
    throw new Error('ENOENT: no such file or directory, open "missing-file.txt"');
  } catch (error) {
    demoLogger.error('File operation failed', {
      error: error.message,
      operation: 'readFile',
      filePath: 'missing-file.txt',
      timestamp: new Date().toISOString(),
    });
  }

  demoLogger.info('3. Warning with structured data');

  demoLogger.warn('High memory usage detected', {
    memoryUsage: process.memoryUsage(),
    threshold: '80%',
    recommendation: 'Consider restarting the application',
  });

  demoLogger.info('4. Info with performance metrics');

  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const duration = Date.now() - startTime;

  demoLogger.info('Operation completed', {
    operation: 'dataProcessing',
    duration: `${duration}ms`,
    status: 'success',
  });

  demoLogger.info('5. Debug logging');

  demoLogger.debug('Processing user data', {
    userId: '12345',
    dataSize: '2.5MB',
    processingSteps: ['validation', 'transformation', 'storage'],
  });

  demoLogger.info('6. Error with retry context');

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      if (Math.random() > 0.5) {
        throw new Error('Network timeout');
      }
      demoLogger.info('Operation succeeded', { attempt: retryCount + 1 });
      break;
    } catch (error) {
      retryCount++;
      demoLogger.warn('Operation failed, retrying', {
        error: error.message,
        attempt: retryCount,
        maxRetries,
        willRetry: retryCount < maxRetries,
      });

      if (retryCount >= maxRetries) {
        demoLogger.error('Operation failed after all retries', {
          error: error.message,
          totalAttempts: retryCount,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  demoLogger.info('7. Child logger with different context');

  const userLogger = logger.child('[user-service]');

  userLogger.info('User login attempt', {
    method: 'email',
    ipAddress: '192.168.1.100',
  });

  demoLogger.info('8. JSON output demonstration');

  const complexData = {
    user: {
      id: 'user-123',
      name: 'John Doe',
      preferences: {
        theme: 'dark',
        language: 'en',
      },
    },
    session: {
      id: 'session-456',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };

  demoLogger.info('Complex data structure logged as JSON', complexData);

  demoLogger.info('=== Demo completed successfully ===');
}

demonstrateErrorHandling().catch((error) => {
  logger.error('Demo failed', { error: error.message });
  process.exit(1);
});
