export * from "./constants";
export { LoggerFactory } from "./factories";
export { LogFormatter } from "./formatters";
export { Logger } from "./logger";
export type { ILogger, LogData, LogEntry, LoggerConfig } from "./types";
export { LogLevel } from "./types";
export { configureLogger, createChildLogger, createLogger, log, setLogLevel };

import { LoggerFactory } from "./factories";
import { Logger } from "./logger";
import type { LogData, LoggerConfig } from "./types";
import { LogLevel } from "./types";

const defaultLogger = new Logger();

const log = {
	error: (message: string, data?: LogData) =>
		defaultLogger.error(message, data),

	warn: (message: string, data?: LogData) => defaultLogger.warn(message, data),

	info: (message: string, data?: LogData) => defaultLogger.info(message, data),

	debug: (message: string, data?: LogData) =>
		defaultLogger.debug(message, data),

	trace: (message: string, data?: LogData) =>
		defaultLogger.trace(message, data),
};

const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);

const createChildLogger = (prefix: string) => defaultLogger.child(prefix);

const setLogLevel = (level: LogLevel) => defaultLogger.setLevel(level);

const configureLogger = (config: Partial<LoggerConfig>) =>
	defaultLogger.setConfig(config);

const mainLogger = {
	error: defaultLogger.error.bind(defaultLogger),
	warn: defaultLogger.warn.bind(defaultLogger),
	info: defaultLogger.info.bind(defaultLogger),
	debug: defaultLogger.debug.bind(defaultLogger),
	trace: defaultLogger.trace.bind(defaultLogger),
	setLevel: defaultLogger.setLevel.bind(defaultLogger),
	setConfig: defaultLogger.setConfig.bind(defaultLogger),
	getConfig: defaultLogger.getConfig.bind(defaultLogger),
	child: defaultLogger.child.bind(defaultLogger),
	isEnabled: defaultLogger.isEnabled.bind(defaultLogger),
	table: defaultLogger.table.bind(defaultLogger),

	analyzeError: defaultLogger.analyzeError.bind(defaultLogger),
	getInsight: defaultLogger.getInsight.bind(defaultLogger),
	enableAI: defaultLogger.enableAI.bind(defaultLogger),
	disableAI: defaultLogger.disableAI.bind(defaultLogger),
	enableLogTranslation: defaultLogger.enableLogTranslation.bind(defaultLogger),
	disableLogTranslation:
		defaultLogger.disableLogTranslation.bind(defaultLogger),
	isAIHealthy: defaultLogger.isAIHealthy.bind(defaultLogger),
	testAI: defaultLogger.testAI.bind(defaultLogger),
	getAIStats: defaultLogger.getAIStats.bind(defaultLogger),
	switchAIProvider: defaultLogger.switchAIProvider.bind(defaultLogger),

	log: log,
	createLogger,
	createChildLogger,
	setLogLevel,
	configureLogger,
	LogLevel,
	Logger,

	createJsonLogger: LoggerFactory.createJsonLogger,
	createMinimalLogger: LoggerFactory.createMinimalLogger,
	createVerboseLogger: LoggerFactory.createVerboseLogger,

	LoggerFactory,
};

export const logger = mainLogger;

export default mainLogger;
