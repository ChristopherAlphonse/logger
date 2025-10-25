#!/usr/bin/env tsx

import { join } from 'node:path';
import { ConfigManager } from './src/config-manager';

/**
 * Setup script for AI-powered logging
 */

async function main() {
  console.log('AI-Powered Logger Setup\n');

  console.log('Creating sample configuration...');
  const configPath = join(process.cwd(), '.logger-ai.config.json');
  ConfigManager.createSampleConfig(configPath);

  console.log('\nNext Steps:\n');

  console.log('Option 1: FREE Local AI (Recommended)');
  console.log('----------------------------------------');
  console.log('1. Install Ollama: https://ollama.ai');
  console.log('2. Pull a model: ollama pull llama3.2:3b');
  console.log('3. Start Ollama service');
  console.log('4. Your logger will automatically use free local AI!');

  console.log('\nOption 2: Cloud AI (Paid)');
  console.log('--------------------------');
  console.log('1. Edit .logger-ai.config.json');
  console.log('2. Add your OpenAI API key');
  console.log('3. Change provider from "ollama" to "openai"');
  console.log('4. Save the file');

  console.log('\nTesting your setup:');
  console.log('----------------------');
  console.log('Run: npm run example:ai-demo');
  console.log('or: tsx examples/ai-powered-demo.ts');

  console.log('\nUsage in your code:');
  console.log('----------------------');
  console.log(`
import { EnhancedLogger } from '@calphonse/logger';

const logger = new EnhancedLogger();

try {
  // Your code here
} catch (error) {
  // AI will automatically analyze this error!
  logger.error('Something went wrong', error);
}
  `);

  console.log('\nTesting current configuration...\n');

  try {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getAIConfig();

    console.log(`Provider: ${config.provider}`);
    console.log(`Enabled: ${config.enabled ? 'Yes' : 'No'}`);

    if (config.provider === 'ollama') {
      console.log(`Ollama URL: ${config.ollama?.baseUrl}`);
      console.log(`Model: ${config.ollama?.model}`);
    }
  } catch (error) {
    console.error('Error testing current configuration:', error);
  }
}

// Execute the main function
main().catch(console.error);
