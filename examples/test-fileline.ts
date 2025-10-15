import { EnhancedLogger, Logger } from "../src";

/**
 * Exercises Logger and EnhancedLogger methods to validate console compatibility and file:line reporting.
 *
 * Runs a series of logging calls (info, warn, error), console-compatible methods (`logConsole`, `errorConsole`),
 * and an error throw/catch fed to the enhanced logger for analysis. Intended to demonstrate and compare:
 * - traditional console-style output vs. the project's logger
 * - file:line reporting (new logger) instead of timestamps
 *
 * Side effects:
 * - Writes multiple log entries to the console (via the logger implementations and direct console.log).
 */
function testConsoleCompatibility() {
	const logger = new Logger();
	const enhancedLogger = new EnhancedLogger();

	// Test basic logger - should show file:line instead of timestamps
	logger.info("Basic logger with file:line tracking");
	logger.warn("This is a warning message");
	logger.error("This is an error message");

	// Test console-compatible methods
	logger.logConsole("Console-style:", "multiple", "arguments", {
		data: "object",
	});
	logger.errorConsole("Console error with object:", new Error("Test error"));

	// Test enhanced logger with AI capabilities
	enhancedLogger.info("Enhanced logger with AI capabilities");
	enhancedLogger.logConsole("Enhanced console-style logging");

	// Test with actual error for AI analysis
	try {
		throw new Error("Intentional test error for AI analysis");
	} catch (error) {
		enhancedLogger.errorConsole("AI will analyze this error:", error);
	}

	console.log("\n--- Comparison ---");
	console.log("OLD (console.log): No file/line info, just raw output");

	logger.info("NEW (our logger): Shows filename:line instead of timestamps");
}

// Test with nested function calls to show different line numbers
function nestedFunction() {
	const logger = new Logger();
	logger.debug("Called from nested function");
	return true;
}

function anotherFunction() {
	const logger = new Logger();
	logger.info("Called from another function");
	nestedFunction();
}

// Run the tests
console.log("Testing file:line tracking vs timestamps...\n");
testConsoleCompatibility();
console.log("\nTesting nested function calls...\n");
anotherFunction();
