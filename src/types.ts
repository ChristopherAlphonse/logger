export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

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

export enum ConfidenceLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  VERY_HIGH = 3,
}

export type AIProvider = 'openai' | 'claude' | 'ollama' | 'disabled';

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

export interface AIInsight {
  explanation: string;

  likelyCauses: string[];

  suggestedFix: string;

  contextualInsights: string[];

  confidence: ConfidenceLevel;

  processingTime: number;

  cached: boolean;

  framework?: FrameworkContext;
}

export interface ErrorAnalysis {
  error: Error;

  stackTrace: StackFrame[];

  errorType: string;

  insight?: AIInsight;

  errorHash: string;
}

export interface StackFrame {
  functionName?: string;

  fileName?: string;

  lineNumber?: number;

  columnNumber?: number;

  source?: string;

  isUserCode: boolean;
}

export interface AIConfig {
  enabled: boolean;

  provider: AIProvider;

  apiKey?: string;

  caching: boolean;

  confidenceThreshold: ConfidenceLevel;

  maxInsightLength: number;

  timeout: number;

  translateLogs: boolean;

  translateLogLevels: LogLevel[];

  ollama?: {
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  openai?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    organization?: string;
  };

  claude?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  prompts?: {
    errorAnalysis?: string;
    stackTraceAnalysis?: string;
    contextAnalysis?: string;
    logTranslation?: string;
  };

  rateLimit?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
}

export interface ErrorPattern {
  id: string;

  signature: string;

  count: number;

  firstSeen: Date;

  lastSeen: Date;

  insights: string[];

  solutions: string[];
}

export interface LoggerConfig {
  level?: LogLevel;

  timestamps?: boolean;

  colors?: boolean;

  timestampFormat?: string;

  showSource?: boolean;

  prefix?: string;

  json?: boolean;

  output?: NodeJS.WritableStream | { write: (chunk: string) => void };

  ai?: Partial<AIConfig>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  data?: LogData;
  prefix?: string;

  aiAnalysis?: ErrorAnalysis;

  patterns?: ErrorPattern[];
}

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

  analyzeError?(error: Error): Promise<ErrorAnalysis>;
  getInsight?(error: Error): Promise<AIInsight | null>;
  enableAI?(config?: Partial<AIConfig>): void;
  disableAI?(): void;
  enableLogTranslation?(): void;
  disableLogTranslation?(): void;
}

export interface IAIService {
  analyzeError(error: Error, context?: Record<string, unknown>): Promise<AIInsight>;
  analyzeStackTrace(
    stackTrace: StackFrame[],
    context?: Record<string, unknown>
  ): Promise<AIInsight>;
  detectFramework(stackTrace: StackFrame[], errorMessage: string): FrameworkContext;
  translateLog(message: string, level: LogLevel, data?: LogData): Promise<string>;
  isHealthy(): Promise<boolean>;
}

export interface IAICache {
  get(key: string): Promise<AIInsight | null>;
  set(key: string, insight: AIInsight, ttl?: number): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<{ hits: number; misses: number; size: number }>;
}

export type ChalkColor = (text: string) => string;

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
