#!/usr/bin/env tsx

/**
 * Enhanced Logger Usage Example
 *
 * Demonstrates the new API with preset context enums and console-like interface
 */

import { logger } from '../src/index';
// Test multiple contexts to ensure proper spacing
// Single context (recommended)
logger.info('Message', {}, ['MONITORING', 'HEALTH', 'METRICS']);
