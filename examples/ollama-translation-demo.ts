#!/usr/bin/env tsx

import { Logger } from "../src/logger";
import { LogLevel } from "../src/types";

async function main() {
	console.log("Ollama Log Translation Demo\n");

	const logger = new Logger({
		level: LogLevel.DEBUG,
		colors: true,
		timestamps: true,
		prefix: "App",
		ai: {
			enabled: true,
			provider: "ollama",
			translateLogs: true,
			translateLogLevels: [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO], // Translate error, warn, and info logs
			ollama: {
				baseUrl: "http://localhost:11434",
				model: "llama3.2:3b",
				temperature: 0.3, // Lower temperature for more consistent translations
				maxTokens: 200,
			},
		},
	});

	// Check if AI service is available
	const isAIHealthy = await logger.isAIHealthy();
	console.log(
		`🔍 AI Service Status: ${isAIHealthy ? "✅ Available" : "❌ Unavailable"}`,
	);

	if (!isAIHealthy) {
		console.log("\n📋 To enable Ollama translation:");
		console.log("1. Install Ollama: https://ollama.ai");
		console.log("2. Run: ollama pull llama3.2:3b");
		console.log("3. Start service: ollama serve");
		console.log("4. Run this demo again\n");

		// Show what logs would look like without translation
		console.log("🔤 Standard logs (without translation):");
		logger.disableLogTranslation();
	} else {
		console.log("\n🔤 Logs with AI translation enabled:");
		logger.enableLogTranslation();
	}

	console.log(`\n${"=".repeat(50)}`);

	// Example 1: Database connection error
	console.log("\n📊 Example 1: Database Connection Error");
	logger.error(
		"Connection timeout after 5000ms to database server mysql://localhost:3306/myapp",
	);

	// Wait a moment for translation to complete
	await sleep(2000);

	// Example 2: Memory warning
	console.log("\n📊 Example 2: Memory Warning");
	logger.warn(
		"Memory usage exceeded 85% threshold: 3.4GB/4GB allocated, consider increasing heap size or optimizing memory usage",
	);

	await sleep(2000);

	// Example 3: API rate limit
	console.log("\n📊 Example 3: API Rate Limit");
	logger.error(
		"HTTP 429 Too Many Requests: Rate limit exceeded for API key abc123, retry after 60 seconds",
	);

	await sleep(2000);

	// Example 4: File operation
	console.log("\n📊 Example 4: File Operation Info");
	logger.info(
		"Successfully processed batch job: 1247 records inserted, 23 records skipped due to validation errors, execution time: 2.3s",
	);

	await sleep(2000);

	// Example 5: Authentication failure
	console.log("\n📊 Example 5: Authentication Failure");
	logger.warn(
		"JWT token validation failed: token expired at 2025-08-16T10:30:00Z, current time: 2025-08-16T10:45:00Z",
	);

	await sleep(2000);

	// Example 6: Debug message (should not be translated by default)
	console.log("\n📊 Example 6: Debug Message (not translated)");
	logger.debug(
		"Executing SQL query: SELECT * FROM users WHERE last_login > ?",
		{
			params: ["2025-08-01"],
		},
	);

	console.log(`\n${"=".repeat(50)}`);
	console.log(
		"\n✨ Demo completed! Technical logs have been translated to human-readable explanations.",
	);

	// Show configuration
	const aiStats = logger.getAIStats();
	if (aiStats) {
		console.log("\n📈 AI Translation Stats:");
		console.log(`   Provider: ${aiStats.provider}`);
		console.log(`   Total requests: ${aiStats.requestCount}`);
		console.log(`   Recent requests: ${aiStats.recentRequests}`);
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

// Handle errors gracefully
main().catch((error) => {
	console.error("❌ Demo failed:", error);
	process.exit(1);
});
