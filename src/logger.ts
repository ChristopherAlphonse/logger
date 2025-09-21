import chalkModule from 'chalk';
import { AIService } from './ai-service';
import { ConfigManager } from './config-manager';
import { processConsoleArgs } from './console-utils';
import { LogFormatter } from './formatters';
import { createInternalLogger } from './internalLogger';
import {
  type ILogger,
  type LogData,
  type LogEntry,
  LogLevel,
  type LoggerConfig,
} from './types';
import type { AIInsight, ErrorAnalysis } from './types';

const chalk =
  (chalkModule as typeof chalkModule & { default?: typeof chalkModule })
    ?.default || chalkModule;

export class Logger implements ILogger {
  private config: LoggerConfig;
  private formatter: LogFormatter;
  private aiService: AIService | null = null;
  private configManager: ConfigManager;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      timestamps: false,
      colors: true,
      timestampFormat: 'HH:mm:ss',
      showSource: true,
      prefix: '',
      json: false,
      output:
        typeof process !== 'undefined' && process.stdout
          ? process.stdout
          : { write: console.log },
      ...config,
    };

    if (this.config.output && !this.isValidOutputStream(this.config.output)) {
      const internalLogger = createInternalLogger('[LOGGER]');
      internalLogger.warn(
        'Invalid output stream provided in configuration. Falling back to process.stdout. Please check your logger configuration.'
      );
      this.config.output =
        typeof process !== 'undefined' && process.stdout
          ? process.stdout
          : { write: console.log };
    }

    this.formatter = new LogFormatter();
    this.configManager = ConfigManager.getInstance();

    if (config.ai) {
      this.configManager.updateConfig({
        ai: {
          ...this.configManager.getAIConfig(),
          ...config.ai,
        },
      });
    }

    this.initializeAI();
  }

  error(message: string, data?: LogData): void {
    this.log(LogLevel.ERROR, message, data);
    this.analyzeWithAI(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log(LogLevel.WARN, message, data);
    this.analyzeWithAI(LogLevel.WARN, message, data);
  }

  info(message: string, data?: LogData): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: LogData): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  trace(message: string, data?: LogData): void {
    this.log(LogLevel.TRACE, message, data);
  }

  log(level: LogLevel, message: string, data?: LogData): void {
    if (!this.isEnabled(level)) {
      return;
    }

    if (this.shouldTranslateLog(level)) {
      this.logWithTranslation(level, message, data);
      return;
    }

    this.logDirect(level, message, data);
  }

  private logDirect(level: LogLevel, message: string, data?: LogData): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      prefix: this.config.prefix,
    };

    if (this.config.showSource) {
      entry.source = this.getSourceInfo();
    }

    const output = this.formatter.formatLogEntry(entry, this.config);
    this.write(output);
  }

  private async logWithTranslation(
    level: LogLevel,
    message: string,
    data?: LogData
  ): Promise<void> {
    this.logDirect(level, message, data);

    try {
      if (this.aiService) {
        const translatedMessage = await this.aiService.translateLog(
          message,
          level,
          data
        );

        if (translatedMessage && translatedMessage !== message) {
          this.displayAITranslation(translatedMessage, level);
        }
      }
    } catch (error) {
      const internalLogger = createInternalLogger('[LOGGER]');
      internalLogger.warn('Log translation failed', {
        error,
        originalMessage: message,
      });
    }
  }

  private displayAITranslation(
    translatedMessage: string,
    level: LogLevel
  ): void {
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : '';

    if (this.config.colors) {
      let colorCode = '';
      switch (level) {
        case LogLevel.ERROR:
          colorCode = '\x1b[91m';
          break;
        case LogLevel.WARN:
          colorCode = '\x1b[93m';
          break;
        case LogLevel.INFO:
          colorCode = '\x1b[94m';
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          colorCode = '\x1b[90m';
          break;
      }
      const resetCode = '\x1b[0m';
      const output = `${prefix}💡 AI Translation: ${colorCode}${translatedMessage}${resetCode}\n`;
      this.write(output);
    } else {
      const output = `${prefix}💡 AI Translation: ${translatedMessage}\n`;
      this.write(output);
    }
  }

  private getLevelColor(_level: LogLevel): ((text: string) => string) | null {
    return null;
  }

  private shouldTranslateLog(level: LogLevel): boolean {
    if (!this.aiService) return false;

    const aiConfig = this.configManager.getAIConfig();
    return (
      aiConfig.enabled &&
      aiConfig.translateLogs &&
      aiConfig.translateLogLevels.includes(level)
    );
  }

  logConsole(...args: unknown[]): void {
    const { message, data } = processConsoleArgs(args);
    this.info(message, data as LogData);
  }

  warnConsole(...args: unknown[]): void {
    const { message, data } = processConsoleArgs(args);
    this.warn(message, data as LogData);
  }

  errorConsole(...args: unknown[]): void {
    const { message, data } = processConsoleArgs(args);
    this.error(message, data as LogData);
  }

  infoConsole(...args: unknown[]): void {
    const { message, data } = processConsoleArgs(args);
    this.info(message, data as LogData);
  }

  debugConsole(...args: unknown[]): void {
    const { message, data } = processConsoleArgs(args);
    this.debug(message, data as LogData);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  isEnabled(level: LogLevel): boolean {
    return level <= (this.config.level || LogLevel.INFO);
  }

  child(prefix: string): Logger {
    const childConfig = { ...this.config, prefix };
    return new Logger(childConfig);
  }

  table(
    dataOrLevel: LogLevel | Record<string, unknown>[],
    dataOrOptions?:
      | Record<string, unknown>[]
      | { headers?: string[]; border?: boolean },
    options: { headers?: string[]; border?: boolean } = {}
  ): void {
    let level: LogLevel;
    let data: Record<string, unknown>[];
    let finalOptions: { headers?: string[]; border?: boolean };

    if (Array.isArray(dataOrLevel)) {
      level = LogLevel.INFO;
      data = dataOrLevel;
      finalOptions =
        (dataOrOptions as { headers?: string[]; border?: boolean }) || {};
    } else {
      level = dataOrLevel;
      data = dataOrOptions as Record<string, unknown>[];
      finalOptions = options;
    }

    if (!this.isEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message: 'Table data',
      timestamp: new Date(),
      data,
      prefix: this.config.prefix,
    };

    if (this.config.showSource) {
      entry.source = this.getSourceInfo();
    }

    if (this.config.json) {
      const output = this.formatter.formatJson(entry);
      this.write(output);
    } else {
      const outputs = this.formatter.formatTable(
        entry,
        data,
        this.config,
        finalOptions
      );
      for (const output of outputs) {
        this.write(output);
      }
    }
  }

  private write(output: string): void {
    const stream =
      this.config.output ||
      (typeof process !== 'undefined' && process.stdout
        ? process.stdout
        : { write: console.log });
    stream.write(output);
  }

  private getSourceInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes('node_modules') ||
        line.includes('packages/logger') ||
        line.includes('Logger.log') ||
        line.includes('Logger.logDirect') ||
        line.includes('Logger.logWithTranslation') ||
        line.includes('Logger.error') ||
        line.includes('Logger.warn') ||
        line.includes('Logger.info') ||
        line.includes('Logger.debug') ||
        line.includes('Logger.trace') ||
        line.includes('getSourceInfo') ||
        line.includes('formatLogEntry') ||
        line.includes('write')
      ) {
        continue;
      }
      const regex1 = /at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/;
      let match = regex1.exec(line);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName =
          filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
      const regex2 = /at\s+(.+):(\d+):(\d+)/;
      match = regex2.exec(line);
      if (match) {
        const [, filePath, lineNum] = match;
        const fileName =
          filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
    }

    return 'unknown';
  }

  private initializeAI(): void {
    try {
      const aiConfig = this.configManager.getAIConfig();
      if (aiConfig.enabled) {
        this.aiService = new AIService();
      }
    } catch (error) {
      const internalLogger = createInternalLogger('[LOGGER]');
      internalLogger.warn('AI service initialization failed', { error });
    }
  }

  private async analyzeWithAI(
    level: LogLevel,
    message: string,
    data?: LogData
  ): Promise<void> {
    if (!this.aiService || !this.shouldAnalyzeWithAI(level, data)) {
      return;
    }

    try {
      const error =
        data instanceof Error ? data : (data as Record<string, unknown>)?.error;
      if (error instanceof Error) {
        const insight = await this.aiService.analyzeError(error, {
          message,
          data,
        });
        this.displayAIInsight(insight);
      }
    } catch (analysisError) {
      const internalLogger = createInternalLogger('[LOGGER]');
      internalLogger.warn('AI error analysis failed', { analysisError });
    }
  }

  private shouldAnalyzeWithAI(level: LogLevel, data?: LogData): boolean {
    if (level !== LogLevel.ERROR && level !== LogLevel.WARN) return false;
    if (data instanceof Error) return true;
    if (data && typeof data === 'object' && 'error' in data) return true;

    return false;
  }

  private displayAIInsight(insight: AIInsight): void {
    const defaultOutput =
      typeof process !== 'undefined' && process.stdout
        ? process.stdout.write
        : console.log;
    const output = this.config.output?.write || defaultOutput;
    const header = this.config.colors
      ? chalk.cyan('\nAI Insight:\n')
      : '\nAI Insight:\n';
    const explanation = this.config.colors
      ? chalk.blue(`   Explanation: ${insight.explanation}\n`)
      : `   Explanation: ${insight.explanation}\n`;
    const likelyCauses = this.config.colors
      ? chalk.yellow(`   Likely Causes: ${insight.likelyCauses.join(', ')}\n`)
      : `   Likely Causes: ${insight.likelyCauses.join(', ')}\n`;
    const suggestedFix = this.config.colors
      ? chalk.green(`   Suggested Fix: ${insight.suggestedFix}\n`)
      : `   Suggested Fix: ${insight.suggestedFix}\n`;
    output(header);
    output(explanation);
    output(likelyCauses);
    output(suggestedFix);

    if (insight.contextualInsights.length > 0) {
      const context = this.config.colors
        ? chalk.magenta(
            `   Context: ${insight.contextualInsights.join(', ')}\n`
          )
        : `   Context: ${insight.contextualInsights.join(', ')}\n`;
      output(context);
    }
  }
  async analyzeError(error: Error): Promise<ErrorAnalysis> {
    if (!this.aiService) {
      throw new Error('AI service not initialized');
    }
    const insight = await this.aiService.analyzeError(error);
    return {
      error,
      stackTrace: [],
      errorType: error.name,
      errorHash: '',
      insight,
    };
  }

  async getInsight(error: Error): Promise<AIInsight | null> {
    if (!this.aiService) return null;
    return await this.aiService.analyzeError(error);
  }

  enableAI(): void {
    this.aiService ??= new AIService();
  }

  disableAI(): void {
    this.aiService = null;
  }

  enableLogTranslation(): void {
    this.configManager.updateConfig({
      ai: {
        ...this.configManager.getAIConfig(),
        translateLogs: true,
      },
    });
    this.aiService ??= new AIService();
  }

  disableLogTranslation(): void {
    this.configManager.updateConfig({
      ai: {
        ...this.configManager.getAIConfig(),
        translateLogs: false,
      },
    });
  }

  async isAIHealthy(): Promise<boolean> {
    if (!this.aiService) return false;
    return await this.aiService.isHealthy();
  }

  async testAI(): Promise<{ success: boolean; message: string }> {
    if (!this.aiService) {
      return { success: false, message: 'AI service not initialized' };
    }
    const isHealthy = await this.aiService.isHealthy();
    return {
      success: isHealthy,
      message: isHealthy
        ? 'AI service is working'
        : 'AI service health check failed',
    };
  }

  getAIStats(): Record<string, unknown> | null {
    if (!this.aiService) return null;
    return this.aiService.getStats();
  }

  async switchAIProvider(
    provider: 'ollama' | 'openai' | 'claude' | 'disabled'
  ): Promise<void> {
    this.configManager.updateConfig({
      ai: {
        ...this.configManager.getAIConfig(),
        provider,
      },
    });
    this.aiService = new AIService();
  }

  private isValidOutputStream(
    stream: NodeJS.WritableStream | { write: (chunk: string) => void }
  ): boolean {
    if (!stream || typeof stream !== 'object') return false;
    if (typeof stream.write !== 'function') return false;
    if (
      typeof process !== 'undefined' &&
      (stream === process.stdout || stream === process.stderr)
    )
      return true;
    if (stream.constructor?.name) {
      const validConstructors = [
        'WriteStream',
        'Socket',
        'PassThrough',
        'Transform',
        'Object', // Allow test mocks
      ];
      return validConstructors.includes(stream.constructor.name);
    }

    return false;
  }
}
