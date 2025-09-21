#!/usr/bin/env tsx

import { Logger, LogLevel } from '../src/index';

const logger = new Logger({ level: LogLevel.INFO, colors: true });

logger.info('Testing Colored Units in Tables\n');

const metrics = [
  { operation: 'Fast Query', time: '15ms', memory: '1.2MB', cpu: '5%' },
  { operation: 'Medium Task', time: '250ms', memory: '8.5MB', cpu: '12%' },
  { operation: 'Long Process', time: '2.5s', memory: '45.7MB', cpu: '25%' },
  { operation: 'Big Job', time: '1m', memory: '1.2GB', cpu: '80%' },
];

logger.info('Performance Metrics with Colored Units:');
logger.table(metrics);

const files = [
  { name: 'config.json', size: '2KB', modified: '1h' },
  { name: 'image.jpg', size: '1.5MB', modified: '2d' },
  { name: 'video.mp4', size: '500MB', modified: '1m' },
  { name: 'backup.zip', size: '2.3GB', modified: '7d' },
];

logger.info('\nFile Sizes with Colored Units:');
logger.table(files);

console.log('\nUnits (ms, s, m, h, d, KB, MB, GB, %) are now in gray!');
