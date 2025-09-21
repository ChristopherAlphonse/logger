#!/usr/bin/env npx tsx

import { LogLevel, Logger } from '../src/index';

const logger = new Logger({ level: LogLevel.INFO });

const demoLogger = new Logger({
  level: LogLevel.INFO,
  timestamps: false,
  colors: true,
});

demoLogger.info('='.repeat(60));
demoLogger.info('Logger Table Method Demonstration');
demoLogger.info('='.repeat(60));

demoLogger.info('\nBasic Table with Borders:');
const userData = [
  { name: 'Alice Johnson', age: 28, role: 'Engineer', salary: 85000 },
  { name: 'Bob Smith', age: 34, role: 'Designer', salary: 72000 },
  { name: 'Charlie Brown', age: 29, role: 'Manager', salary: 95000 },
  { name: 'Diana Prince', age: 31, role: 'Developer', salary: 78000 },
];
logger.table(userData);

demoLogger.info('\nTable without Borders:');
logger.table(userData);

demoLogger.info('\nTable with Mixed Data Types:');
const mixedData = [
  {
    id: 1,
    name: 'Product A',
    price: 29.99,
    inStock: true,
    category: 'Electronics',
    lastUpdated: new Date('2024-01-15'),
    tags: ['new', 'popular'],
  },
  {
    id: 2,
    name: 'Product B',
    price: 15.5,
    inStock: false,
    category: 'Books',
    lastUpdated: new Date('2024-01-10'),
    tags: ['bestseller'],
  },
  {
    id: 3,
    name: 'Product C',
    price: 199.99,
    inStock: true,
    category: 'Gadgets',
    lastUpdated: new Date('2024-01-20'),
    tags: [],
  },
];

logger.table(mixedData);

demoLogger.info('\nTable with Missing Data:');
const incompleteData = [
  { name: 'Alice', email: 'alice@example.com', phone: '555-0123' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', phone: '555-0789' },
  { name: 'Diana' },
];

logger.table(incompleteData);

demoLogger.info('\nEmpty Table:');
logger.table([]);

demoLogger.info('\nLogger with Prefix:');
const prefixedLogger = logger.child('DATA');
prefixedLogger.table(userData.slice(0, 2));

demoLogger.info('\nPerformance Metrics Table:');
const performanceData = [
  {
    operation: 'Database Query',
    duration: '45ms',
    memory: '2.3MB',
    status: 'SUCCESS',
  },
  {
    operation: 'API Call',
    duration: '120ms',
    memory: '1.8MB',
    status: 'SUCCESS',
  },
  {
    operation: 'File Processing',
    duration: '2.1s',
    memory: '15.7MB',
    status: 'WARNING',
  },
  {
    operation: 'Cache Update',
    duration: '8ms',
    memory: '0.5MB',
    status: 'SUCCESS',
  },
];

logger.table(performanceData);
