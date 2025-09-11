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
 * AI insight confidence levels
 */
export enum ConfidenceLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  VERY_HIGH = 3,
}

/**
 * AI provider types
 */
export type AIProvider = 'openai' | 'claude' | 'ollama' | 'disabled';

/**
 * Framework context types
 */
export type FrameworkContext =
  | 'react'
  | 'next'
  | 'express'
  | 'fastify'
  | 'nest'
  | 'vue'
  | 'angular'
  | 'node'
  | 'browser'
  | 'unknown';

/**
 * AI insight structure
 */
export interface AIInsight {
  /** Generated explanation of the error */
  explanation: string;
  /** Likely causes of the issue */
  likelyCauses: string[];
  /** Suggested fixes or next steps */
  suggestedFix: string;
  /** Framework-specific contextual insights */
  contextualInsights: string[];
  /** Confidence level of the analysis */
  confidence: ConfidenceLevel;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Whether this insight was cached */
  cached: boolean;
  /** Detected framework context */
  framework?: FrameworkContext;
}

/**
 * Error analysis result
 */
export interface ErrorAnalysis {
  /** Original error object */
  error: Error;
  /** Parsed stack trace */
  stackTrace: StackFrame[];
  /** Error classification */
  errorType: string;
  /** AI-generated insight */
  insight?: AIInsight;
  /** Error hash for caching */
  errorHash: string;
}

/**
 * Stack frame information
 */
export interface StackFrame {
  /** Function name */
  functionName?: string;
  /** File path */
  fileName?: string;
  /** Line number */
  lineNumber?: number;
  /** Column number */
  columnNumber?: number;
  /** Source code snippet if available */
  source?: string;
  /** Whether this frame is from user code */
  isUserCode: boolean;
}

/**
 * AI configuration options
 */
export interface AIConfig {
  /** Whether AI features are enabled */
  enabled: boolean;
  /** AI provider to use */
  provider: AIProvider;
  /** API key for the provider */
  apiKey?: string;
  /** Enable response caching */
  caching: boolean;
  /** Minimum confidence threshold for displaying insights */
  confidenceThreshold: ConfidenceLevel;
  /** Maximum length of AI insights */
  maxInsightLength: number;
  /** Timeout for AI requests in milliseconds */
  timeout: number;
  /** Enable log message translation to human-readable format */
  translateLogs: boolean;
  /** Log levels that should be translated (default: error, warn) */
  translateLogLevels: LogLevel[];
  /** Ollama-specific configuration */
  ollama?: {
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  /** OpenAI-specific configuration */
  openai?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    organization?: string;
  };
  /** Claude-specific configuration */
  claude?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  /** Custom prompt templates */
  prompts?: {
    errorAnalysis?: string;
    stackTraceAnalysis?: string;
    contextAnalysis?: string;
    logTranslation?: string;
  };
  /** Rate limiting configuration */
  rateLimit?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
}

/**
 * Pattern recognition data
 */
export interface ErrorPattern {
  /** Unique pattern identifier */
  id: string;
  /** Error signature */
  signature: string;
  /** Occurrence count */
  count: number;
  /** First occurrence timestamp */
  firstSeen: Date;
  /** Last occurrence timestamp */
  lastSeen: Date;
  /** Associated insights */
  insights: string[];
  /** Potential solutions */
  solutions: string[];
}

/**
 * Extended logger configuration with AI features
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
  output?: any;
  /** AI configuration options */
  ai?: Partial<AIConfig>;
}

/**
 * Enhanced log entry with AI insights
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  data?: LogData;
  prefix?: string;
  /** AI analysis for errors */
  aiAnalysis?: ErrorAnalysis;
  /** Associated error patterns */
  patterns?: ErrorPattern[];
}

/**
 * Enhanced logger interface with AI capabilities
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

  /** AI-specific methods */
  analyzeError?(error: Error): Promise<ErrorAnalysis>;
  getInsight?(error: Error): Promise<AIInsight | null>;
  enableAI?(config?: Partial<AIConfig>): void;
  disableAI?(): void;
  enableLogTranslation?(): void;
  disableLogTranslation?(): void;
}

/**
 * AI service interface
 */
export interface IAIService {
  analyzeError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<AIInsight>;
  analyzeStackTrace(
    stackTrace: StackFrame[],
    context?: Record<string, unknown>
  ): Promise<AIInsight>;
  detectFramework(
    stackTrace: StackFrame[],
    errorMessage: string
  ): FrameworkContext;
  translateLog(
    message: string,
    level: LogLevel,
    data?: LogData
  ): Promise<string>;
  isHealthy(): Promise<boolean>;
}

/**
 * Cache interface for AI responses
 */
export interface IAICache {
  get(key: string): Promise<AIInsight | null>;
  set(key: string, insight: AIInsight, ttl?: number): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<{ hits: number; misses: number; size: number }>;
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
