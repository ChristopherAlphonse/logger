import chalkModule from 'chalk';
import { LoggerFactory } from './factories';
import { LogFormatter } from './formatters';
import {
  type ILogger,
  type LogData,
  type LogEntry,
  LogLevel,
  type LoggerConfig,
} from './types';
import type { AIInsight, ErrorAnalysis } from './types';
import { AIService } from './ai-service';
import { ConfigManager } from './config-manager';
import { processConsoleArgs } from './console-utils';
import { createInternalLogger } from './internalLogger';

const chalk =
  (chalkModule as typeof chalkModule & { default?: typeof chalkModule })
    ?.default || chalkModule;

/**
 * A customizable logger class that wraps console output with color support using chalk.
 * Provides flexible logging with configurable levels, timestamps, source information,
 * and output formats (human-readable or JSON).
 *
 * @example
 * ```typescript
 * const logger = new Logger({ level: LogLevel.INFO, prefix: 'App' });
 * logger.info('Application started');
 * logger.error('Database connection failed', { errorCode: 'DB001' });
 * ```
 */
export class Logger implements ILogger {
  private config: LoggerConfig;
  private formatter: LogFormatter;
  private aiService: AIService | null = null;
  private configManager: ConfigManager;

  /**
   * Creates a new Logger instance with the specified configuration.
   *
   * @param config - Configuration options for the logger. All options are optional
   *                 and have sensible defaults.
   *
   * @example
   * ```typescript
   * // Basic usage with defaults
   * const logger = new Logger();
   *
   * // Custom configuration
   * const logger = new Logger({
   *   level: LogLevel.DEBUG,
   *   prefix: 'MyApp',
   *   colors: true,
   *   timestamps: true,
   *   showSource: true
   * });
   *
   * // JSON output for production
   * const logger = new Logger({
   *   json: true,
   *   colors: false,
   *   level: LogLevel.WARN
   * });
   * ```
   */
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

  /**
   * Logs an error message with optional additional data.
   *
   * @param message - The error message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.error('Failed to connect to database', { errorCode: 'DB001', retryCount: 3 });
   * ```
   */
  error(message: string, data?: LogData): void {
    this.log(LogLevel.ERROR, message, data);
    this.analyzeWithAI(LogLevel.ERROR, message, data);
  }

  /**
   * Logs a warning message with optional additional data.
   *
   * @param message - The warning message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.warn('Low memory warning', { memoryUsage: '85%' });
   * ```
   */
  warn(message: string, data?: LogData): void {
    this.log(LogLevel.WARN, message, data);
    this.analyzeWithAI(LogLevel.WARN, message, data);
  }

  /**
   * Logs an informational message with optional additional data.
   *
   * @param message - The info message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.info('User logged in', { userId: '12345' });
   * ```
   */
  info(message: string, data?: LogData): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a debug message with optional additional data.
   *
   * @param message - The debug message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.debug('Processing request', { requestId: 'abc123' });
   * ```
   */
  debug(message: string, data?: LogData): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs a trace message with optional additional data.
   *
   * @param message - The trace message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @example
   * ```typescript
   * logger.trace('Function called', { function: 'processUserData', args: { id: 1 } });
   * ```
   */
  trace(message: string, data?: LogData): void {
    this.log(LogLevel.TRACE, message, data);
  }

  /**
   * Logs a message with the specified log level and optional data.
   *
   * @param level - The log level (ERROR, WARN, INFO, DEBUG, TRACE).
   * @param message - The message to log.
   * @param data - Optional metadata or additional details to include in the log.
   *
   * @remarks
   * The message is only logged if the specified level is enabled based on the configured minimum log level.
   * If AI translation is enabled, the message may be translated to human-readable format.
   */
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

  /**
   * Log directly without translation
   */
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

  /**
   * Log with AI translation
   */
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

  /**
   * Display AI translation as additional context
   */
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

  /**
   * Get color function for log level
   */
  private getLevelColor(level: LogLevel): ((text: string) => string) | null {
    // Removed this method as we're using direct ANSI codes instead
    return null;
  }

  /**
   * Determine if log should be translated
   */
  private shouldTranslateLog(level: LogLevel): boolean {
    if (!this.aiService) return false;

    const aiConfig = this.configManager.getAIConfig();
    return (
      aiConfig.enabled &&
      aiConfig.translateLogs &&
      aiConfig.translateLogLevels.includes(level)
    );
  }

  // Console Compatibility Methods

  /**
   * Console.log compatible method - logs multiple arguments like console.log
   *
   * This method provides seamless migration from console.log to our logger.
   * It supports multiple arguments, format strings, and object logging.
   * Maps to INFO level by default.
   *
   * @param args - Any number of arguments, processed like console.log
   *
   * @example
   * ```typescript
   * // All of these work like console.log:
   * logger.logConsole('Hello world');
   * logger.logConsole('User:', user, 'Action:', action);
   * logger.logConsole('Count: %d, Name: %s', 42, 'John');
   * logger.logConsole('Data:', { key: 'value' }, [1, 2, 3]);
   * ```
   */
  logConsole(...args: any[]): void {
    const { message, data } = processConsoleArgs(args);
    this.info(message, data);
  }

  /**
   * Console.warn compatible method - processes multiple arguments like console.warn
   *
   * @param args - Any number of arguments, processed like console.warn
   */
  warnConsole(...args: any[]): void {
    const { message, data } = processConsoleArgs(args);
    this.warn(message, data);
  }

  /**
   * Console.error compatible method - processes multiple arguments like console.error
   *
   * @param args - Any number of arguments, processed like console.error
   */
  errorConsole(...args: any[]): void {
    const { message, data } = processConsoleArgs(args);
    this.error(message, data);
  }

  /**
   * Console.info compatible method - processes multiple arguments like console.info
   *
   * @param args - Any number of arguments, processed like console.info
   */
  infoConsole(...args: any[]): void {
    const { message, data } = processConsoleArgs(args);
    this.info(message, data);
  }

  /**
   * Console.debug compatible method - processes multiple arguments like console.debug
   *
   * @param args - Any number of arguments, processed like console.debug
   */
  debugConsole(...args: any[]): void {
    const { message, data } = processConsoleArgs(args);
    this.debug(message, data);
  }

  /**
   * Sets the minimum log level for this logger instance.
   *
   * Only messages at or above the specified level will be output.
   * Log levels are hierarchical: ERROR < WARN < INFO < DEBUG < TRACE
   *
   * @param level - The minimum log level to output
   *
   * @example
   * ```typescript
   * const logger = new Logger();
   *
   * // Only show errors and warnings
   * logger.setLevel(LogLevel.WARN);
   * logger.info('This will not be shown'); // Hidden
   * logger.warn('This will be shown');     // Visible
   *
   * // Show all messages including debug
   * logger.setLevel(LogLevel.DEBUG);
   * logger.debug('Now this is visible');
   * ```
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Updates the logger configuration with new settings.
   *
   * This method merges the provided configuration with the existing one,
   * allowing you to update unknown combination of settings without losing
   * other configured values.
   *
   * @param config - Partial configuration to merge with current settings
   *
   * @example
   * ```typescript
   * const logger = new Logger();
   *
   * // Update multiple settings at once
   * logger.setConfig({
   *   level: LogLevel.DEBUG,
   *   prefix: 'API',
   *   showSource: true
   * });
   *
   * // Switch to JSON output for production
   * logger.setConfig({
   *   json: true,
   *   colors: false,
   *   level: LogLevel.WARN
   * });
   * ```
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Returns a copy of the current logger configuration.
   *
   * This method returns a shallow copy of the configuration object,
   * so modifying the returned object won't affect the logger's settings.
   *
   * @returns A copy of the current LoggerConfig
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.DEBUG, prefix: 'App' });
   *
   * const config = logger.getConfig();
   * console.log(config.level); // LogLevel.DEBUG
   * console.log(config.prefix); // 'App'
   *
   * // The returned config is a copy, so it's safe to modify
   * config.level = LogLevel.INFO; // Doesn't affect the logger
   * ```
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Checks if a specific log level is enabled for this logger.
   *
   * A log level is considered enabled if it is at or above the configured
   * minimum log level. This is useful for conditional logging or performance
   * optimization.
   *
   * @param level - The log level to check
   * @returns `true` if the level is enabled, `false` otherwise
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.WARN });
   *
   * logger.isEnabled(LogLevel.ERROR); // true
   * logger.isEnabled(LogLevel.WARN);  // true
   * logger.isEnabled(LogLevel.INFO);  // false
   * logger.isEnabled(LogLevel.DEBUG); // false
   *
   * // Use for conditional logging
   * if (logger.isEnabled(LogLevel.DEBUG)) {
   *   const expensiveData = computeExpensiveData();
   *   logger.debug('Expensive data computed', expensiveData);
   * }
   * ```
   */
  isEnabled(level: LogLevel): boolean {
    return level <= (this.config.level || LogLevel.INFO);
  }

  /**
   * Creates a child logger that inherits all configuration from this logger
   * but adds a prefix to all log messages.
   *
   * Child loggers are useful for organizing logs by module, component, or
   * unknown other logical grouping. They maintain all the parent's settings
   * including colors, timestamps, and log levels.
   *
   * @param prefix - The prefix to add to all log messages from this child logger
   * @returns A new Logger instance with the specified prefix
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.DEBUG });
   *
   * const dbLogger = logger.child('Database');
   * const apiLogger = logger.child('API');
   * const authLogger = logger.child('Auth');
   *
   * dbLogger.info('Connection established');
   * apiLogger.info('Request processed');
   * authLogger.warn('Token expired');
   *
   * // Output:
   * // [18:30:15] [Database] [INFO] Connection established
   * // [18:30:16] [API] [INFO] Request processed
   * // [18:30:17] [Auth] [WARN] Token expired
   *
   * // Child loggers can also create their own children
   * const userDbLogger = dbLogger.child('Users');
   * userDbLogger.debug('Query executed', { table: 'users', rows: 42 });
   * // Output: [18:30:18] [Database] [Users] [DEBUG] Query executed
   * ```
   */
  child(prefix: string): Logger {
    const childConfig = { ...this.config, prefix };
    return new Logger(childConfig);
  }

  /**
   * Logs tabular data in a formatted table with colored headers.
   *
   * @param dataOrLevel - The data array or log level (defaults to LogLevel.INFO if data is passed)
   * @param dataOrOptions - The data array (if level was specified) or options
   * @param options - Optional configuration for table display
   *
   * @example
   * ```typescript
   * const logger = new Logger({ level: LogLevel.INFO, prefix: 'App' });
   * const data = [
   *   { name: 'Alice', age: 25, role: 'Engineer' },
   *   { name: 'Bob', age: 30, role: 'Designer' }
   * ];
   *
   * // Simple usage (defaults to INFO level)
   * logger.table(data);
   *
   * // With specific log level
   * logger.table(LogLevel.DEBUG, data);
   *
   * // With options
   * logger.table(data, { headers: ['Person', 'Years', 'Job'], border: false });
   *
   * // With level and options
   * logger.table(LogLevel.WARN, data, { border: false });
   * ```
   */
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

  /**
   * Write output to the configured stream
   */
  private write(output: string): void {
    const stream =
      this.config.output ||
      (typeof process !== 'undefined' && process.stdout
        ? process.stdout
        : { write: console.log });
    stream.write(output);
  }

  /**
   * Get source file information for the calling function
   */
  private getSourceInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip internal logger methods and node_modules
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

      // Try different stack trace formats
      const regex1 = /at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/;
      let match = regex1.exec(line);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName =
          filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }

      // Try format without function name (anonymous functions)
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

  // Static factory methods removed - use LoggerFactory instead

  /**
   * Initialize AI service based on configuration
   */
  private initializeAI(): void {
    try {
      const aiConfig = this.configManager.getAIConfig();
      if (aiConfig.enabled) {
        this.aiService = new AIService();
      }
    } catch (error) {
      // AI initialization fails gracefully - logging still works without AI
      const internalLogger = createInternalLogger('[LOGGER]');
      internalLogger.warn('AI service initialization failed', { error });
    }
  }

  /**
   * Analyze message and data with AI
   */
  private async analyzeWithAI(
    level: LogLevel,
    message: string,
    data?: LogData
  ): Promise<void> {
    if (!this.aiService || !this.shouldAnalyzeWithAI(level, data)) {
      return;
    }

    try {
      const error = data instanceof Error ? data : (data as any)?.error;
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

  /**
   * Determine if AI analysis should be performed
   */
  private shouldAnalyzeWithAI(level: LogLevel, data?: LogData): boolean {
    if (level !== LogLevel.ERROR && level !== LogLevel.WARN) return false;

    // Analyze if data contains an Error object
    if (data instanceof Error) return true;
    if (data && typeof data === 'object' && 'error' in data) return true;

    return false;
  }

  /**
   * Display AI insight in a formatted way
   */
  private displayAIInsight(insight: AIInsight): void {
    const defaultOutput =
      typeof process !== 'undefined' && process.stdout
        ? process.stdout.write
        : console.log;
    const output = this.config.output?.write || defaultOutput;

    // Apply color formatting conditionally
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

    // Output all content once
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

  // AI-specific methods
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

    // Ensure AI service is initialized
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
    // Update the config manager with the new provider
    this.configManager.updateConfig({
      ai: {
        ...this.configManager.getAIConfig(),
        provider: provider as any,
      },
    });

    // Reinitialize AI service with new config
    this.aiService = new AIService();
  }

  /**
   * Validate output stream for security
   */
  private isValidOutputStream(stream: NodeJS.WritableStream): boolean {
    if (!stream || typeof stream !== 'object') return false;

    // Check if it has the necessary methods
    if (typeof stream.write !== 'function') return false;

    // Allow standard streams
    if (
      typeof process !== 'undefined' &&
      (stream === process.stdout || stream === process.stderr)
    )
      return true;

    // Allow file streams and other writable streams with proper constructor
    if (stream.constructor && stream.constructor.name) {
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
