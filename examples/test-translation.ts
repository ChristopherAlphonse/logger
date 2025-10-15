#!/usr/bin/env tsx

import { Logger } from "../src/logger";
import { LogLevel } from "../src/types";

/**
 * Runs a self-contained test of Ollama-based log translation using the project's Logger.
 *
 * Checks the configured AI service health, prints setup instructions and returns early if the AI is unavailable.
 * If healthy, emits three test log entries:
 * 1) an ERROR-level message that should be translated,
 * 2) a WARN-level message that should be translated,
 * 3) an INFO-level message that should not be translated (not included in translateLogLevels).
 *
 * Side effects:
 * - Writes status and progress to stdout via console.log.
 * - Emits logs via the Logger instance which may trigger asynchronous translation requests.
 * - Waits ~5 seconds after each translated test entry to allow asynchronous translation to complete.
 *
 * Intended for manual/local testing; requires an Ollama server (configured in the Logger) to be running for translation to occur.
 */

async function testTranslation() {
	console.log("Testing Ollama log translation...\n");

	const logger = new Logger({
		level: LogLevel.INFO,
		colors: true,
		timestamps: false, // Disable for cleaner test output
		ai: {
			enabled: true,
			provider: "ollama",
			translateLogs: true,
			translateLogLevels: [LogLevel.ERROR, LogLevel.WARN],
			ollama: {
				baseUrl: "http://localhost:11434",
				model: "gemma3:latest", // Use available model
				temperature: 0.3,
				maxTokens: 150,
			},
		},
	});

	// Test AI health
	const isHealthy = await logger.isAIHealthy();
	console.log(`AI Service: ${isHealthy ? "Available" : "Not Available"}\n`);

	if (!isHealthy) {
		console.log("Please ensure Ollama is running:");
		console.log("1. Install Ollama: https://ollama.ai");
		console.log("2. Run: ollama pull llama3.2:3b");
		console.log("3. Start: ollama serve\n");
		return;
	}

	// Test translation
	console.log("Testing log translation:\n");

	// This should be translated (ERROR level)
	console.log("1. Testing ERROR level translation:");
	logger.error("Connection timeout after 5000ms to database server");

	// Wait for async translation
	console.log("   Waiting for translation...");
	await new Promise((resolve) => setTimeout(resolve, 5000));

	// This should be translated (WARN level)
	console.log("\n2. Testing WARN level translation:");
	logger.warn("Memory usage exceeded 85% threshold");

	// Wait for async translation
	console.log("   Waiting for translation...");
	await new Promise((resolve) => setTimeout(resolve, 5000));

	// This should NOT be translated (INFO level not in translateLogLevels)
	console.log("\n3. Testing INFO level (should not be translated):");
	logger.info("This info message should appear as-is without translation");

	console.log("\nTest completed!");
}

testTranslation().catch(console.error);
