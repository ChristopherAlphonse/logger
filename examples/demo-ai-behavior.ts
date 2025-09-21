#!/usr/bin/env tsx

import { Logger } from '../src/logger';
import { LogLevel } from '../src/types';

async function demoExpectedBehavior() {
  console.log('Demo: Expected AI Translation Behavior\n');
  console.log(
    'This shows what the output looks like when Ollama is set up with the correct model:\n'
  );

  console.log('='.repeat(60));
  console.log('ORIGINAL TECHNICAL LOG:');
  console.log('[ERROR] [app.ts:123] Connection timeout after 5000ms to database server');
  console.log(
    "AI Translation: The application couldn't connect to the database because it took too long to respond"
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('ORIGINAL TECHNICAL LOG:');
  console.log('[WARN] [memory.ts:45] Memory usage exceeded 85% threshold: 3.4GB/4GB allocated');
  console.log(
    'AI Translation: The system is using too much memory and might slow down or crash soon'
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('ORIGINAL TECHNICAL LOG:');
  console.log(
    '[ERROR] [api.ts:67] HTTP 429 Too Many Requests: Rate limit exceeded for API key abc123'
  );
  console.log(
    'AI Translation: Too many requests were made to the API too quickly, need to wait before trying again'
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('INFO LOG (Not translated - not in translateLogLevels):');
  console.log('[INFO] [app.ts:89] User authentication successful');

  console.log(`\n${'='.repeat(60)}`);
  console.log('\n This is the expected behavior when:');
  console.log('1. Ollama is installed and running');
  console.log('2. The correct model (llama3.2:3b) is downloaded');
  console.log('3. translateLogs is enabled for ERROR and WARN levels');

  console.log('\n To set up Ollama:');
  console.log('1. Install: https://ollama.ai');
  console.log('2. Download model: ollama pull llama3.2:3b');
  console.log('3. Start service: ollama serve');
  console.log('4. Run test: pnpm run test-translation');
}

async function testCurrentStatus() {
  console.log('\n Testing Current Status:\n');

  const logger = new Logger({
    level: LogLevel.INFO,
    colors: true,
    timestamps: false,
    ai: {
      enabled: true,
      provider: 'ollama',
      translateLogs: true,
      translateLogLevels: [LogLevel.ERROR, LogLevel.WARN],
    },
  });

  const isHealthy = await logger.isAIHealthy();
  console.log(`AI Service Health: ${isHealthy ? 'Available' : 'Not Available'}`);

  if (isHealthy) {
    console.log('\nOllama is running! Testing actual translation:');
    logger.error('Connection timeout after 5000ms to database server');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.log('\nOllama not available. The implementation is ready but needs setup.');
    console.log('   Running with fallback (original messages only):');
    logger.error('Connection timeout after 5000ms to database server');
    logger.warn('Memory usage exceeded 85% threshold');
  }
}

async function main() {
  await demoExpectedBehavior();
  await testCurrentStatus();
}

main().catch(console.error);
