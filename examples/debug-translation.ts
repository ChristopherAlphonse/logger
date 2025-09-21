#!/usr/bin/env tsx

import { Logger } from '../src/logger';
import { LogLevel } from '../src/types';

/**
 * Run an interactive debug routine that exercises the logger's AI translation features.
 *
 * Performs a health check, retrieves AI statistics, attempts a direct translation via the logger's
 * internal AI service (accessed reflectively), emits a test ERROR log through the logger, and
 * waits 10 seconds to allow asynchronous translation/processing to complete.
 *
 * Notes:
 * - If the AI health check fails the function returns early and no further steps are executed.
 * - The function writes progress and results to the console and uses the Logger instance configured
 *   with AI translation enabled.
 *
 * @returns A promise that resolves when the debug routine completes.
 */

async function debugTranslation() {
  console.log('Debug: Testing AI translation step by step...\n');

  const logger = new Logger({
    level: LogLevel.INFO,
    colors: true,
    timestamps: false,
    ai: {
      enabled: true,
      provider: 'ollama',
      translateLogs: true,
      translateLogLevels: [LogLevel.ERROR, LogLevel.WARN],
      ollama: {
        baseUrl: 'http://localhost:11434',
        model: 'llama3.2:3b',
        temperature: 0.3,
        maxTokens: 150,
      },
    },
  });

  // Check AI health
  console.log('1. Checking AI health...');
  const isHealthy = await logger.isAIHealthy();
  console.log(`   AI Health: ${isHealthy}`);

  if (!isHealthy) {
    console.log('   AI not available, stopping test');
    return;
  }

  // Try to get AI service stats
  console.log('\n2. Checking AI stats...');
  const stats = logger.getAIStats();
  console.log('   AI Stats:', stats);

  // Test a simple translation directly through AI service
  console.log('\n3. Testing AI service directly...');
  try {
    // Access the private AI service for debugging
    const aiService = (logger as any).aiService;
    if (aiService) {
      console.log('   AI Service exists, testing translation...');
      const translated = await aiService.translateLog(
        'Connection timeout after 5000ms to database server',
        LogLevel.ERROR
      );
      console.log('   Direct translation result:', translated);
    } else {
      console.log('   AI Service is null');
    }
  } catch (error) {
    console.log('   Direct translation error:', error.message);
  }

  // Test through logger
  console.log('\n4. Testing through logger...');
  console.log('   About to log ERROR message...');
  logger.error('Connection timeout after 5000ms to database server');

  // Wait and see what happens
  console.log('   Waiting 10 seconds...');
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log('\nDebug test completed!');
}

debugTranslation().catch((error) => {
  console.error('Debug test failed:', error);
});
