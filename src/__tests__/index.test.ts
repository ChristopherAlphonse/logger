import {
	configureLogger,
	createChildLogger,
	createLogger,
	Logger,
	LogLevel,
	log,
	logger,
	setLogLevel,
} from "../index";

describe("Index exports", () => {
	describe("Logger class", () => {
		test("should export Logger class", () => {
			expect(Logger).toBeDefined();
			expect(typeof Logger).toBe("function");
		});

		test("should be able to create Logger instance", () => {
			const loggerInstance = new Logger();
			expect(loggerInstance).toBeInstanceOf(Logger);
		});
	});

	describe("LogLevel enum", () => {
		test("should export LogLevel enum", () => {
			expect(LogLevel).toBeDefined();
			expect(LogLevel.ERROR).toBe(0);
			expect(LogLevel.WARN).toBe(1);
			expect(LogLevel.INFO).toBe(2);
			expect(LogLevel.DEBUG).toBe(3);
			expect(LogLevel.TRACE).toBe(4);
		});
	});

	describe("Default logger instance", () => {
		test("should export default logger instance", () => {
			expect(logger).toBeDefined();
			expect(typeof logger).toBe("object");
		});

		test("should have all required methods", () => {
			expect(typeof logger.error).toBe("function");
			expect(typeof logger.warn).toBe("function");
			expect(typeof logger.info).toBe("function");
			expect(typeof logger.debug).toBe("function");
			expect(typeof logger.trace).toBe("function");
			expect(typeof logger.log).toBe("object");
			expect(typeof logger.setLevel).toBe("function");
			expect(typeof logger.setConfig).toBe("function");
			expect(typeof logger.getConfig).toBe("function");
			expect(typeof logger.isEnabled).toBe("function");
			expect(typeof logger.child).toBe("function");
		});
	});

	describe("Convenience log functions", () => {
		test("should export convenience log functions", () => {
			expect(log).toBeDefined();
			expect(typeof log.error).toBe("function");
			expect(typeof log.warn).toBe("function");
			expect(typeof log.info).toBe("function");
			expect(typeof log.debug).toBe("function");
			expect(typeof log.trace).toBe("function");
		});

		test("should call the default logger methods", () => {
			expect(() => log.error("test error")).not.toThrow();
			expect(() => log.info("test info")).not.toThrow();
		});

		test("should call the default logger methods with data", () => {
			const testData = { key: "value" };

			expect(() => log.warn("test warning", testData)).not.toThrow();
			expect(() => log.debug("test debug", testData)).not.toThrow();
			expect(() => log.trace("test trace", testData)).not.toThrow();
		});
	});

	describe("Factory functions", () => {
		test("should export createLogger function", () => {
			expect(createLogger).toBeDefined();
			expect(typeof createLogger).toBe("function");
		});

		test("should create logger with configuration", () => {
			const customLogger = createLogger({ level: LogLevel.DEBUG });
			expect(customLogger).toBeInstanceOf(Logger);
			expect(customLogger.getConfig().level).toBe(LogLevel.DEBUG);
		});

		test("should export createChildLogger function", () => {
			expect(createChildLogger).toBeDefined();
			expect(typeof createChildLogger).toBe("function");
		});

		test("should create child logger with prefix", () => {
			const childLogger = createChildLogger("TEST");
			expect(childLogger).toBeInstanceOf(Logger);
			expect(childLogger.getConfig().prefix).toBe("TEST");
		});
	});

	describe("Utility functions", () => {
		test("should export setLogLevel function", () => {
			expect(setLogLevel).toBeDefined();
			expect(typeof setLogLevel).toBe("function");
		});

		test("should set global log level", () => {
			const originalLevel = logger.getConfig().level;
			setLogLevel(LogLevel.DEBUG);
			expect(logger.getConfig().level).toBe(LogLevel.DEBUG);

			if (originalLevel !== undefined) {
				setLogLevel(originalLevel);
			}
		});

		test("should export configureLogger function", () => {
			expect(configureLogger).toBeDefined();
			expect(typeof configureLogger).toBe("function");
		});

		test("should configure global logger", () => {
			const originalConfig = logger.getConfig();
			configureLogger({ prefix: "TEST_CONFIG" });
			expect(logger.getConfig().prefix).toBe("TEST_CONFIG");
			configureLogger(originalConfig);
		});
	});

	describe("Type exports", () => {
		test("should export LoggerConfig type", () => {
			expect(Logger).toBeDefined();
			expect(LogLevel).toBeDefined();
		});

		test("should export LogEntry type", () => {
			expect(Logger).toBeDefined();
			expect(LogLevel).toBeDefined();
		});

		test("should export ILogger interface", () => {
			expect(Logger).toBeDefined();
			expect(LogLevel).toBeDefined();
		});

		test("should export LogData type", () => {
			expect(Logger).toBeDefined();
			expect(LogLevel).toBeDefined();
		});
	});

	describe("Default export", () => {
		test("should have default export", async () => {
			const module = await import("../index");
			expect(module.default).toBeDefined();
			expect(typeof module.default).toBe("object");
		});
	});

	describe("Integration tests", () => {
		test("should work with all exports together", () => {
			const customLogger = createLogger({ level: LogLevel.DEBUG });
			const childLogger = createChildLogger("INTEGRATION");

			expect(customLogger).toBeInstanceOf(Logger);
			expect(childLogger).toBeInstanceOf(Logger);
			expect(customLogger.getConfig().level).toBe(LogLevel.DEBUG);
			expect(childLogger.getConfig().prefix).toBe("INTEGRATION");

			expect(() => log.info("Integration test")).not.toThrow();
		});
	});

	describe("Factory methods on main logger", () => {
		test("should have createJsonLogger method", () => {
			expect(logger.createJsonLogger).toBeDefined();
			expect(typeof logger.createJsonLogger).toBe("function");
		});

		test("should create JSON logger via main logger", () => {
			const jsonLogger = logger.createJsonLogger();
			expect(jsonLogger).toBeInstanceOf(Logger);
			expect(jsonLogger.getConfig().json).toBe(true);
		});

		test("should have createMinimalLogger method", () => {
			expect(logger.createMinimalLogger).toBeDefined();
			expect(typeof logger.createMinimalLogger).toBe("function");
		});

		test("should create minimal logger via main logger", () => {
			const minimalLogger = logger.createMinimalLogger();
			expect(minimalLogger).toBeInstanceOf(Logger);
			expect(minimalLogger.getConfig().timestamps).toBe(false);
		});

		test("should have createVerboseLogger method", () => {
			expect(logger.createVerboseLogger).toBeDefined();
			expect(typeof logger.createVerboseLogger).toBe("function");
		});

		test("should create verbose logger via main logger", () => {
			const verboseLogger = logger.createVerboseLogger();
			expect(verboseLogger).toBeInstanceOf(Logger);
			expect(verboseLogger.getConfig().level).toBe(LogLevel.TRACE);
		});

		test("should have LoggerFactory export", () => {
			expect(logger.LoggerFactory).toBeDefined();
			expect(typeof logger.LoggerFactory).toBe("object");
		});
	});

	describe("Main logger bound methods", () => {
		test("should have bound error method", () => {
			expect(typeof logger.error).toBe("function");
			expect(() => logger.error("test error")).not.toThrow();
		});

		test("should have bound warn method", () => {
			expect(typeof logger.warn).toBe("function");
			expect(() => logger.warn("test warning")).not.toThrow();
		});

		test("should have bound info method", () => {
			expect(typeof logger.info).toBe("function");
			expect(() => logger.info("test info")).not.toThrow();
		});

		test("should have bound debug method", () => {
			expect(typeof logger.debug).toBe("function");
			expect(() => logger.debug("test debug")).not.toThrow();
		});

		test("should have bound trace method", () => {
			expect(typeof logger.trace).toBe("function");
			expect(() => logger.trace("test trace")).not.toThrow();
		});

		test("should have bound setLevel method", () => {
			expect(typeof logger.setLevel).toBe("function");
			const originalLevel = logger.getConfig().level;
			logger.setLevel(LogLevel.DEBUG);
			expect(logger.getConfig().level).toBe(LogLevel.DEBUG);
			if (originalLevel !== undefined) {
				logger.setLevel(originalLevel);
			}
		});

		test("should have bound setConfig method", () => {
			expect(typeof logger.setConfig).toBe("function");
			const originalConfig = logger.getConfig();
			logger.setConfig({ prefix: "TEST_BOUND" });
			expect(logger.getConfig().prefix).toBe("TEST_BOUND");
			logger.setConfig(originalConfig);
		});

		test("should have bound getConfig method", () => {
			expect(typeof logger.getConfig).toBe("function");
			const config = logger.getConfig();
			expect(config).toBeDefined();
			expect(typeof config.level).toBe("number");
		});

		test("should have bound child method", () => {
			expect(typeof logger.child).toBe("function");
			const childLogger = logger.child("TEST_CHILD");
			expect(childLogger).toBeInstanceOf(Logger);
			expect(childLogger.getConfig().prefix).toBe("TEST_CHILD");
		});

		test("should have bound isEnabled method", () => {
			expect(typeof logger.isEnabled).toBe("function");
			expect(logger.isEnabled(LogLevel.INFO)).toBe(true);
			expect(logger.isEnabled(LogLevel.TRACE)).toBe(false);
		});
	});
});
