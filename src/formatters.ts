import chalkModule from "chalk";
import {
	type ChalkColor,
	type LogEntry,
	type LoggerConfig,
	LogLevel,
} from "./types";

const chalk =
	(chalkModule as typeof chalkModule & { default?: typeof chalkModule })
		?.default || chalkModule;

export class LogFormatter {
	private levelNames = {
		[LogLevel.ERROR]: "ERROR",
		[LogLevel.WARN]: "WARN",
		[LogLevel.INFO]: "INFO",
		[LogLevel.DEBUG]: "DEBUG",
		[LogLevel.TRACE]: "TRACE",
	};

	private levelTagColors: Record<LogLevel, ChalkColor> = {
		[LogLevel.ERROR]: chalk.red.bold,
		[LogLevel.WARN]: chalk.yellow.bold,
		[LogLevel.INFO]: chalk.blue.bold,
		[LogLevel.DEBUG]: chalk.green.bold,
		[LogLevel.TRACE]: chalk.gray.bold,
	};

	private messageColors: Record<LogLevel, ChalkColor> = {
		[LogLevel.ERROR]: chalk.red,
		[LogLevel.WARN]: chalk.yellow,
		[LogLevel.INFO]: chalk.blue,
		[LogLevel.DEBUG]: chalk.green,
		[LogLevel.TRACE]: chalk.gray,
	};

	formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
		if (config.json) {
			return this.formatJson(entry);
		}
		return this.formatText(entry, config);
	}

	formatJson(entry: LogEntry): string {
		const jsonEntry = {
			timestamp: entry.timestamp.toISOString(),
			level: this.levelNames[entry.level],
			message: entry.message,
			...(entry.source && { source: entry.source }),
			...(entry.data && { data: entry.data }),
			...(entry.prefix && { prefix: entry.prefix }),
		};

		return `${JSON.stringify(jsonEntry)}\n`;
	}

	formatText(entry: LogEntry, config: LoggerConfig): string {
		const parts: string[] = [];

		this.addTimestamp(parts, entry, config);
		this.addPrefix(parts, entry, config);
		this.addLevelTag(parts, entry, config);
		this.addSource(parts, entry, config);
		this.addMessage(parts, entry, config);
		this.addData(parts, entry, config);

		return `${parts.join(" ")}\n`;
	}

	formatTable(
		entry: LogEntry,
		data: Record<string, unknown>[],
		config: LoggerConfig,
		options: { headers?: string[]; border?: boolean },
	): string[] {
		const { headers = null, border = true } = options;
		const outputs: string[] = [];

		if (!data || data.length === 0) {
			outputs.push(
				this.formatText({ ...entry, message: "No data to display" }, config),
			);
			return outputs;
		}

		const dataKeys = Object.keys(data[0]);
		const displayHeaders = headers || dataKeys;

		const extractionKeys = headers ? dataKeys : displayHeaders;

		const rows = data.map((item: Record<string, unknown>) =>
			extractionKeys.map((col: string) =>
				item[col] !== undefined ? String(item[col]) : "-",
			),
		);

		const colWidths = displayHeaders.map((col: string, i: number) =>
			Math.max(col.length, ...rows.map((row) => row[i].length)),
		);

		const pad = (str: string, len: number) => str.padEnd(len, " ");

		const headerBgColors = [chalk.whiteBright];
		const coloredHeaders = displayHeaders.map((col: string, i: number) => {
			const paddedHeader = pad(col, colWidths[i]);
			if (config.colors) {
				const colorFn = headerBgColors[i % headerBgColors.length];
				return colorFn(paddedHeader);
			}
			return paddedHeader;
		});

		const headerRow = coloredHeaders.join(" | ");
		const separator = colWidths.map((w: number) => "-".repeat(w)).join("-+-");

		const dataRows = rows.map((row) =>
			row.map((cell, i) => pad(cell, colWidths[i])).join(" | "),
		);

		const formatLine = (line: string) => {
			const parts: string[] = [];
			this.addTimestamp(parts, entry, config);
			this.addPrefix(parts, entry, config);
			this.addSource(parts, entry, config);
			parts.push(config.colors ? this.messageColors[entry.level](line) : line);
			return `${parts.join(" ")}\n`;
		};

		if (border) {
			outputs.push(formatLine(`+-${separator}-+`));
			outputs.push(formatLine(`| ${headerRow} |`));
			outputs.push(formatLine(`+-${separator}-+`));
			for (const row of dataRows) {
				outputs.push(formatLine(`| ${row} |`));
			}
			outputs.push(formatLine(`+-${separator}-+`));
		} else {
			outputs.push(formatLine(headerRow));
			for (const row of dataRows) {
				outputs.push(formatLine(row));
			}
		}

		return outputs;
	}

	private addTimestamp(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		if (!config.timestamps) return;

		const timestamp = entry.timestamp.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		parts.push(config.colors ? chalk.gray(`[${timestamp}]`) : `[${timestamp}]`);
	}

	private addPrefix(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		if (!entry.prefix) return;
		parts.push(
			config.colors ? chalk.cyan(`[${entry.prefix}]`) : `[${entry.prefix}]`,
		);
	}

	private addLevelTag(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		const levelName = this.levelNames[entry.level];
		const levelTagColor = this.levelTagColors[entry.level];
		parts.push(
			config.colors ? levelTagColor(`[${levelName}]`) : `[${levelName}]`,
		);
	}

	private addSource(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		if (!entry.source) return;
		parts.push(
			config.colors ? chalk.magenta(`[${entry.source}]`) : `[${entry.source}]`,
		);
	}

	private addMessage(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		const messageColor = this.messageColors[entry.level];
		parts.push(config.colors ? messageColor(entry.message) : entry.message);
	}

	private addData(
		parts: string[],
		entry: LogEntry,
		config: LoggerConfig,
	): void {
		if (entry.data === undefined) return;

		let dataStr: string;
		if (typeof entry.data === "object") {
			try {
				dataStr = JSON.stringify(entry.data, null, 2);
			} catch (_error) {
				dataStr = "[Circular or non-serializable object]";
			}
		} else {
			dataStr = String(entry.data);
		}
		parts.push(config.colors ? chalk.gray(dataStr) : dataStr);
	}
}
