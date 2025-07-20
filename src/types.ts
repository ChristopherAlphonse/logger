/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * Supported data types for logging
 */
export type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[]
  | Error
  | Date;

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Whether to enable timestamps */
  timestamps?: boolean;
  /** Whether to enable colored output */
  colors?: boolean;
  /** Custom timestamp format */
  timestampFormat?: string;
  /** Whether to enable source file information */
  showSource?: boolean;
  /** Custom prefix for all log messages */
  prefix?: string;
  /** Whether to enable JSON output format */
  json?: boolean;
  /** Custom output stream */
  output?: NodeJS.WritableStream;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  data?: LogData;
  prefix?: string;
}

/**
 * Logger interface
 */
export interface ILogger {
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
  trace(message: string, data?: LogData): void;
  log(level: LogLevel, message: string, data?: LogData): void;
  setLevel(level: LogLevel): void;
  setConfig(config: Partial<LoggerConfig>): void;
  getConfig(): LoggerConfig;
  isEnabled(level: LogLevel): boolean;
  child(prefix: string): ILogger;
}

/**
 * Chalk color function type
 */
export type ChalkColor = (text: string) => string;

/**
 * Chalk instance type
 */
export interface ChalkInstance {
  red: ChalkColor;
  green: ChalkColor;
  blue: ChalkColor;
  yellow: ChalkColor;
  magenta: ChalkColor;
  cyan: ChalkColor;
  gray: ChalkColor;
  white: ChalkColor;
  black: ChalkColor;
  bold: ChalkColor;
  italic: ChalkColor;
  underline: ChalkColor;
  inverse: ChalkColor;
  strikethrough: ChalkColor;
}
