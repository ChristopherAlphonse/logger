#!/usr/bin/env tsx

import { Logger } from '../src/logger';
import { LogLevel } from '../src/types';

async function main() {
  logger.log('Ollama Log Translation Demo\n');

  const logger = new Logger({
    level: LogLevel.DEBUG,
    colors: true,
    timestamps: true,
    prefix: 'App',
    ai: {
      enabled: true,
      provider: 'ollama',
      translateLogs: true,
      translateLogLevels: [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO],
      ollama: {
        baseUrl: 'http://localhost:11434',
        model: 'llama3.2:3b',
        temperature: 0.3, // Lower temperature for more consistent translations
        maxTokens: 200,
      },
    },
  });


  const isAIHealthy = await logger.isAIHealthy();
  logger.log(`AI Service Status: ${isAIHealthy ? 'Available' : 'Unavailable'}`);

  if (!isAIHealthy) {
    logger.log('\nTo enable Ollama translation:');
    logger.log('1. Install Ollama: https://ollama.ai');
    logger.log('2. Run: ollama pull llama3.2:3b');
    logger.log('3. Start service: ollama serve');
    logger.log('4. Run this demo again\n');


    logger.log('Standard logs (without translation):');
    logger.disableLogTranslation();
  } else {
    logger.log('\nLogs with AI translation enabled:');
    logger.enableLogTranslation();
  }

  logger.log(`\n${'='.repeat(50)}`);


  logger.log('\nExample 1: Database Connection Error');
  logger.error('Connection timeout after 5000ms to database server mysql://localhost:3306/myapp');


  await sleep(2000);


  logger.log('\nExample 2: Memory Warning');
  logger.warn(
    'Memory usage exceeded 85% threshold: 3.4GB/4GB allocated, consider increasing heap size or optimizing memory usage'
  );

  await sleep(2000);


  logger.log('\nExample 3: API Rate Limit');
  logger.error(
    'HTTP 429 Too Many Requests: Rate limit exceeded for API key abc123, retry after 60 seconds'
  );

  await sleep(2000);


  logger.log('\nExample 4: File Operation Info');
  logger.info(
    'Successfully processed batch job: 1247 records inserted, 23 records skipped due to validation errors, execution time: 2.3s'
  );

  await sleep(2000);


  logger.log('\nExample 5: Authentication Failure');
  logger.warn(
    'JWT token validation failed: token expired at 2025-08-16T10:30:00Z, current time: 2025-08-16T10:45:00Z'
  );

  await sleep(2000);


  logger.log('\nExample 6: Debug Message (not translated)');
  logger.debug('Executing SQL query: SELECT * FROM users WHERE last_login > ?', {
    params: ['2025-08-01'],
  });

  logger.log(`\n${'='.repeat(50)}`);
  logger.log(
    '\n✨ Demo completed! Technical logs have been translated to human-readable explanations.'
  );


  const aiStats = logger.getAIStats();
  if (aiStats) {
    logger.log('\n📈 AI Translation Stats:');
    logger.log(`   Provider: ${aiStats.provider}`);
    logger.log(`   Total requests: ${aiStats.requestCount}`);
    logger.log(`   Recent requests: ${aiStats.recentRequests}`);
  }
}

/**
 * Asynchronously pauses execution for the specified duration.
 *
 * Useful for delaying async flows (e.g., waiting between demo log examples).
 *
 * @param ms - Delay duration in milliseconds.
 * @returns A promise that resolves once the delay has elapsed.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


main().catch((error) => {
  logger.error('Demo failed:', error);
  process.exit(1);
});
