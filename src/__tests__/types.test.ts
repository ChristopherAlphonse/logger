import {
	type ChalkColor,
	type ChalkInstance,
	type ILogger,
	type LogData,
	type LogEntry,
	type LoggerConfig,
	LogLevel,
} from "../types";

describe("Types", () => {
	describe("LogLevel enum", () => {
		it("should have correct numeric values", () => {
			expect(LogLevel.ERROR).toBe(0);
			expect(LogLevel.WARN).toBe(1);
			expect(LogLevel.INFO).toBe(2);
			expect(LogLevel.DEBUG).toBe(3);
			expect(LogLevel.TRACE).toBe(4);
		});

		it("should have all expected levels", () => {
			const levels = Object.values(LogLevel).filter(
				(value) => typeof value === "number",
			);
			expect(levels).toHaveLength(5);
			expect(levels).toEqual([0, 1, 2, 3, 4]);
		});
	});

	describe("LogData type", () => {
		it("should accept string data", () => {
			const data: LogData = "test string";
			expect(typeof data).toBe("string");
		});

		it("should accept number data", () => {
			const data: LogData = 42;
			expect(typeof data).toBe("number");
		});

		it("should accept boolean data", () => {
			const data: LogData = true;
			expect(typeof data).toBe("boolean");
		});

		it("should accept null data", () => {
			const data: LogData = null;
			expect(data).toBeNull();
		});

		it("should accept undefined data", () => {
			const data: LogData = undefined;
			expect(data).toBeUndefined();
		});

		it("should accept object data", () => {
			const data: LogData = { key: "value", number: 42 };
			expect(typeof data).toBe("object");
		});

		it("should accept array data", () => {
			const data: LogData = [1, 2, 3, "test"];
			expect(Array.isArray(data)).toBe(true);
		});

		it("should accept Error objects", () => {
			const data: LogData = new Error("test error");
			expect(data instanceof Error).toBe(true);
		});

		it("should accept Date objects", () => {
			const data: LogData = new Date();
			expect(data instanceof Date).toBe(true);
		});
	});

	describe("LoggerConfig interface", () => {
		it("should allow all optional properties", () => {
			const mockStream = { write: jest.fn() };
			const config: LoggerConfig = {
				level: LogLevel.DEBUG,
				timestamps: true,
				colors: false,
				timestampFormat: "HH:mm:ss",
				showSource: true,
				prefix: "TEST",
				json: true,
				output: mockStream as unknown as NodeJS.WritableStream,
			};

			expect(config.level).toBe(LogLevel.DEBUG);
			expect(config.timestamps).toBe(true);
			expect(config.colors).toBe(false);
			expect(config.timestampFormat).toBe("HH:mm:ss");
			expect(config.showSource).toBe(true);
			expect(config.prefix).toBe("TEST");
			expect(config.json).toBe(true);
			expect(config.output).toBe(mockStream);
		});

		it("should allow partial configuration", () => {
			const config: LoggerConfig = {
				level: LogLevel.INFO,
			};

			expect(config.level).toBe(LogLevel.INFO);
			expect(config.timestamps).toBeUndefined();
		});

		it("should allow empty configuration", () => {
			const config: LoggerConfig = {};
			expect(Object.keys(config)).toHaveLength(0);
		});
	});

	describe("LogEntry interface", () => {
		it("should have required properties", () => {
			const entry: LogEntry = {
				level: LogLevel.INFO,
				message: "test message",
				timestamp: new Date(),
			};

			expect(entry.level).toBe(LogLevel.INFO);
			expect(entry.message).toBe("test message");
			expect(entry.timestamp instanceof Date).toBe(true);
		});

		it("should allow optional properties", () => {
			const entry: LogEntry = {
				level: LogLevel.ERROR,
				message: "error message",
				timestamp: new Date(),
				source: "test.ts:10",
				data: { error: "details" },
				prefix: "TEST",
			};

			expect(entry.source).toBe("test.ts:10");
			expect(entry.data).toEqual({ error: "details" });
			expect(entry.prefix).toBe("TEST");
		});
	});

	describe("ILogger interface", () => {
		it("should define all required methods", () => {
			const logger: ILogger = {
				error: jest.fn(),
				warn: jest.fn(),
				info: jest.fn(),
				debug: jest.fn(),
				trace: jest.fn(),
				log: jest.fn(),
				setLevel: jest.fn(),
				setConfig: jest.fn(),
				getConfig: jest.fn(),
				isEnabled: jest.fn(),
				child: jest.fn(),
			};

			expect(typeof logger.error).toBe("function");
			expect(typeof logger.warn).toBe("function");
			expect(typeof logger.info).toBe("function");
			expect(typeof logger.debug).toBe("function");
			expect(typeof logger.trace).toBe("function");
			expect(typeof logger.log).toBe("function");
			expect(typeof logger.setLevel).toBe("function");
			expect(typeof logger.setConfig).toBe("function");
			expect(typeof logger.getConfig).toBe("function");
			expect(typeof logger.isEnabled).toBe("function");
			expect(typeof logger.child).toBe("function");
		});
	});

	describe("ChalkColor type", () => {
		it("should be a function that takes and returns a string", () => {
			const chalkColor: ChalkColor = (text: string) => `colored_${text}`;
			const result = chalkColor("test");
			expect(result).toBe("colored_test");
		});
	});

	describe("ChalkInstance interface", () => {
		it("should define all expected chalk methods", () => {
			const mockChalk: ChalkInstance = {
				red: jest.fn(),
				green: jest.fn(),
				blue: jest.fn(),
				yellow: jest.fn(),
				magenta: jest.fn(),
				cyan: jest.fn(),
				gray: jest.fn(),
				white: jest.fn(),
				black: jest.fn(),
				bold: jest.fn(),
				italic: jest.fn(),
				underline: jest.fn(),
				inverse: jest.fn(),
				strikethrough: jest.fn(),
			};

			expect(typeof mockChalk.red).toBe("function");
			expect(typeof mockChalk.green).toBe("function");
			expect(typeof mockChalk.blue).toBe("function");
			expect(typeof mockChalk.yellow).toBe("function");
			expect(typeof mockChalk.magenta).toBe("function");
			expect(typeof mockChalk.cyan).toBe("function");
			expect(typeof mockChalk.gray).toBe("function");
			expect(typeof mockChalk.white).toBe("function");
			expect(typeof mockChalk.black).toBe("function");
			expect(typeof mockChalk.bold).toBe("function");
			expect(typeof mockChalk.italic).toBe("function");
			expect(typeof mockChalk.underline).toBe("function");
			expect(typeof mockChalk.inverse).toBe("function");
			expect(typeof mockChalk.strikethrough).toBe("function");
		});
	});
});
