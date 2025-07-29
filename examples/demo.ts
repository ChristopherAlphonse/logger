#!/usr/bin/env tsx

/**
 * Enhanced Logger Usage Example
 *
 * Demonstrates the new API with preset context enums and console-like interface
 */

import { logger } from '../src/index';
// Test multiple contexts to ensure proper spacing
// Single context (recommended)
logger.info(
  'Message',
  {
    name: 'John Doe',
    age: 30,
    _id: crypto.randomUUID(),
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    },
    geolocation: {
      longitude: 123.456,
      latitude: 78.91,
    },
  },
  ['DATABASE', 'API', 'MONITORING']
);

const data = [
  {
    name: 'John Doe',
    age: 30,
    email: 'john.doe@example.com',
    isAdmin: true,
    createdAt: new Date(),
  },
  {
    name: 'Jane Doe',
    age: 25,
    email: 'jane.doe@example.com',
    isAdmin: false,
    createdAt: new Date(),
  },
];
logger.table(data);
logger.info('Simple info message');
logger.error('Simple error message');
logger.warn('Simple warning message');
logger.debug('Simple debug message');
