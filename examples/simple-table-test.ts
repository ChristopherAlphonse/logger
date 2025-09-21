#!/usr/bin/env tsx

import { LogLevel, Logger } from '../src/index';

const logger = new Logger({ level: LogLevel.INFO, colors: true });

console.log('Testing Improved Table Functionality\n');

const users = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
  { name: 'Charlie', age: 29, role: 'Manager' },
];

console.log('User Table:');
logger.table(users);

const products = [
  { id: 1, name: 'Laptop', price: 999.99, inStock: true },
  { id: 2, name: 'Mouse', price: 29.99, inStock: false },
  { id: 3, name: 'Keyboard', price: 79.99, inStock: true },
];

console.log('\nProduct Table:');
logger.table(products);

const metrics = [
  { operation: 'API Call', duration: '120ms', status: 'OK' },
  { operation: 'Database Query', duration: '45ms', status: 'OK' },
  { operation: 'Cache Hit', duration: '2ms', status: 'OK' },
];

console.log('\nPerformance Metrics:');
logger.table(metrics);

console.log('\nTable demo completed!');
