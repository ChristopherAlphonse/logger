#!/usr/bin/env tsx

import { ConfigManager } from '../src/config-manager';
import { EnhancedLogger } from '../src/enhanced-logger';

/**
 * Demo script exercising AI-powered logging features via EnhancedLogger.
 *
 * Runs a sequence of demonstrations that show automatic and manual AI error analysis,
 * provider health/stats checks, provider testing, and configuration inspection.
 *
 * Behavior:
 * - Creates an EnhancedLogger configured to emit errors (triggers AI analysis when available).
 * - Checks AI availability and prints instructions for enabling AI (Ollama or OpenAI).
 * - Shows AI statistics if present.
 * - Demo 1: triggers a TypeError and logs it for automatic AI analysis.
 * - Demo 2: logs a synthetic network error with contextual metadata.
 * - Demo 3: logs a React component error with props and framework hint.
 * - Demo 4: when AI is healthy, performs manual analysis via logger.analyzeError and prints the insight.
 * - Demo 5: runs logger.testAI to validate the AI provider.
 * - Demo 6: prints current configuration (provider, caching, confidence threshold, cache TTL/size).
 *
 * Notes:
 * - Sleeps briefly between demos to allow asynchronous AI responses to arrive.
 * - To enable AI features:
 *   1) FREE: Install Ollama (https://ollama.ai), pull a model (e.g., `ollama pull llama3.2:3b`) and start the service.
 *   2) PAID: Add an OpenAI API key to `.logger-ai.config.json` and set provider to `"openai"`.
 */

async function main() {
  console.log('AI-Powered Logger Demo\n');

  // Create enhanced logger instance
  const logger = new EnhancedLogger({
    level: 0, // ERROR level to see AI analysis
    colors: true,
    timestamps: true,
  });

  // Check AI availability
  const isAIHealthy = await logger.isAIHealthy();
  console.log(`AI Service Status: ${isAIHealthy ? 'Available' : 'Unavailable'}`);

  if (!isAIHealthy) {
    console.log('\nTo enable AI features:');
    console.log('1. FREE: Install Ollama (https://ollama.ai) and run: ollama pull llama3.2:3b');
    console.log('2. PAID: Add OpenAI API key to .logger-ai.config.json');
    console.log('3. Run: node -r tsx/esm examples/ai-powered-demo.ts\n');
  }

  // Get AI stats
  const aiStats = logger.getAIStats();
  if (aiStats) {
    console.log(`AI Provider: ${aiStats.provider}`);
    console.log(`Requests: ${aiStats.requestCount} total, ${aiStats.recentRequests} recent\n`);
  }

  // Demo 1: TypeError with AI analysis
  console.log('Demo 1: TypeError Analysis\n');

  try {
    const user = null;
    // This will cause a TypeError that the AI will analyze
    // @ts-ignore - intentional error for demo
    console.log(user.name.first);
  } catch (error) {
    // The AI will automatically analyze this error when logged
    logger.error('Failed to access user name', error);
  }

  await sleep(2000); // Give AI time to respond

  // Demo 2: Network error with context
  console.log('\nDemo 2: Network Error with Context\n');

  const networkError = new Error('fetch failed');
  networkError.stack = `Error: fetch failed
    at fetchUserData (/app/services/api.ts:42:15)
    at UserComponent (/app/components/User.tsx:18:23)
    at renderComponent (/app/framework/react.js:156:12)`;

  logger.error('API request failed', {
    error: networkError,
    url: 'https://api.example.com/users/123',
    method: 'GET',
    statusCode: 503,
    retryCount: 3,
  });

  await sleep(2000);

  // Demo 3: React component error
  console.log('\nDemo 3: React Component Error\n');

  const reactError = new Error("Cannot read properties of undefined (reading 'map')");
  reactError.stack = `TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (/app/components/UserList.tsx:15:20)
    at renderWithHooks (/app/node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (/app/node_modules/react-dom/cjs/react-dom.development.js:17811:13)`;

  logger.error('React component crashed', {
    error: reactError,
    component: 'UserList',
    props: { users: undefined, loading: false },
    framework: 'react',
  });

  await sleep(2000);

  // Demo 4: Manual AI analysis
  console.log('\nDemo 4: Manual AI Analysis\n');

  if (isAIHealthy) {
    try {
      const customError = new Error('Database connection timeout');
      customError.stack = `Error: Database connection timeout
        at PostgresClient.connect (/app/db/postgres.ts:28:11)
        at UserRepository.findById (/app/repositories/UserRepository.ts:45:18)
        at UserService.getUser (/app/services/UserService.ts:22:25)`;

      const analysis = await logger.analyzeError(customError);
      console.log('Manual Analysis Result:', {
        explanation: analysis.insight?.explanation,
        confidence: analysis.insight?.confidence,
        framework: analysis.insight?.framework,
      });
    } catch (error) {
      console.log('Manual analysis failed:', error);
    }
  }

  // Demo 5: AI provider testing
  console.log('\nDemo 5: AI Provider Test\n');

  const testResult = await logger.testAI();
  console.log(`Provider Test: ${testResult.success ? 'Success' : 'Failed'}`);
  console.log(`Message: ${testResult.message}`);

  // Demo 6: Provider switching (if multiple are configured)
  console.log('\nDemo 6: Configuration Info\n');

  const configManager = ConfigManager.getInstance();
  const config = configManager.getConfig();

  console.log('Current Configuration:');
  console.log(`   Provider: ${config.ai.provider}`);
  console.log(`   Caching: ${config.ai.caching ? 'Enabled' : 'Disabled'}`);
  console.log(`   Confidence Threshold: ${config.ai.confidenceThreshold}`);

  if (config.cache?.enabled) {
    console.log(`   Cache Size: ${config.cache.maxSize}`);
    console.log(`   Cache TTL: ${config.cache.ttl / 1000 / 60} minutes`);
  }

  console.log('\nDemo Complete! Your errors now come with AI insights!');
  console.log('\nKey Benefits:');
  console.log('   • FREE local AI with Ollama (no API costs!)');
  console.log('   • Automatic error analysis and suggestions');
  console.log('   • Framework-specific insights (React, Node.js, etc.)');
  console.log('   • Smart caching to avoid repeated analysis');
  console.log('   • Full backward compatibility with existing code');
}

/**
 * Pauses execution asynchronously for the given duration.
 *
 * Resolves after the specified number of milliseconds.
 *
 * @param ms - Duration to sleep in milliseconds
 * @returns A promise that resolves once the delay has elapsed
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures a sample configuration file exists by creating one if absent.
 *
 * Attempts to create a sample config via ConfigManager.createSampleConfig().
 * Any errors (e.g., config already exists) are swallowed silently.
 */
function createConfigIfNeeded() {
  try {
    ConfigManager.createSampleConfig();
  } catch (_error) {
    // Config might already exist, that's fine
  }
}

// Run the demo
if (require.main === module) {
  createConfigIfNeeded();
  main().catch(console.error);
}
