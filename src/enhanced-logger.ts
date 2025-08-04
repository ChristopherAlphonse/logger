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
import { EnhancedAIService } from './enhanced-ai-service';
import { ConfigManager } from './config-manager';
import { processConsoleArgsWithFormatting } from './console-utils';
import { Logger } from './logger';

// Create internal logger for EnhancedLogger debugging
const internalLogger = new Logger({
  level: LogLevel.WARN,
  timestamps: false,
  colors: true,
  showSource: true,
  prefix: '[ENHANCED-LOGGER]',
});

/**
 * Enhanced Logger class with AI-powered error analysis and insights
 * Maintains full backward compatibility with the original Logger API
 */
export class EnhancedLogger implements ILogger {
  private config: LoggerConfig;
  private formatter: LogFormatter;
  private aiService: EnhancedAIService | null = null;
  private configManager: ConfigManager;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      timestamps: false, // Changed: Disable timestamps by default
      colors: true,
      timestampFormat: 'HH:mm:ss',
      showSource: true, // Changed: Enable source tracking by default (file:line)
      prefix: '',
      json: false,
      output: process.stdout,
      ...config,
    };
    this.formatter = new LogFormatter();
    this.configManager = ConfigManager.getInstance();

    // Initialize AI service if enabled in config
    this.initializeAI();
  }

  /**
   * Initialize AI service based on configuration
   */
  private initializeAI(): void {
    try {
      const aiConfig = this.configManager.getAIConfig();
      if (aiConfig.enabled) {
        this.aiService = new EnhancedAIService();
      }
    } catch (error) {
      // AI initialization fails gracefully - logging still works without AI
      internalLogger.warn('AI service initialization failed', { error });
    }
  }

  /**
   * Enhanced error logging with AI analysis
   */
  error(message: string, data?: LogData): void {
    this.logWithAI(LogLevel.ERROR, message, data);
  }

  /**
   * Enhanced warning logging with AI analysis for Error objects
   */
  warn(message: string, data?: LogData): void {
    this.logWithAI(LogLevel.WARN, message, data);
  }

  /**
   * Standard info logging (no AI analysis by default)
   */
  info(message: string, data?: LogData): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Standard debug logging (no AI analysis by default)
   */
  debug(message: string, data?: LogData): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Standard trace logging (no AI analysis by default)
   */
  trace(message: string, data?: LogData): void {
    this.log(LogLevel.TRACE, message, data);
  }

  /**
   * Enhanced logging method that adds AI analysis for errors
   */
  private async logWithAI(
    level: LogLevel,
    message: string,
    data?: LogData
  ): Promise<void> {
    // First, do the standard logging immediately
    this.log(level, message, data);

    // Then add AI analysis if available and appropriate
    if (this.aiService && this.shouldAnalyzeWithAI(level, data)) {
      try {
        const insight = await this.analyzeWithAI(message, data);
        if (insight) {
          this.displayAIInsight(insight);
        }
      } catch (error) {
        // AI analysis failure doesn't affect normal logging
        internalLogger.warn('AI analysis failed', { error });
      }
    }
  }

  /**
   * Standard logging method (unchanged from original)
   */
  log(level: LogLevel, message: string, data?: LogData): void {
    if (!this.isEnabled(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      source: this.config.showSource ? this.getSource() : undefined,
      data,
      prefix: this.config.prefix,
    };

    const formattedMessage = this.formatMessage(logEntry);
    this.writeOutput(formattedMessage);
  }

  /**
   * Determine if a log entry should be analyzed with AI
   */
  private shouldAnalyzeWithAI(level: LogLevel, data?: LogData): boolean {
    // Only analyze errors and warnings by default
    if (level !== LogLevel.ERROR && level !== LogLevel.WARN) {
      return false;
    }

    // If data contains an Error object, definitely analyze
    if (data instanceof Error) {
      return true;
    }

    // If data is an object with an error property
    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      data.error instanceof Error
    ) {
      return true;
    }

    // If data contains stack trace information
    if (data && typeof data === 'object' && 'stack' in data) {
      return true;
    }

    return false;
  }

  /**
   * Analyze log data with AI
   */
  private async analyzeWithAI(
    message: string,
    data?: LogData
  ): Promise<AIInsight | null> {
    if (!this.aiService) {
      return null;
    }

    let error: Error;

    // Extract Error object from data
    if (data instanceof Error) {
      error = data;
    } else if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      data.error instanceof Error
    ) {
      error = data.error;
    } else {
      // Create a synthetic error from the message
      error = new Error(message);
      // Try to extract stack trace from data if available
      if (
        data &&
        typeof data === 'object' &&
        'stack' in data &&
        typeof data.stack === 'string'
      ) {
        error.stack = data.stack;
      }
    }

    // Create context from additional data
    const context: Record<string, unknown> = {};
    if (data && typeof data === 'object' && !(data instanceof Error)) {
      Object.assign(context, data);
    }

    try {
      return await this.aiService.analyzeError(error, context);
    } catch (analysisError) {
      internalLogger.warn('AI error analysis failed', { analysisError });
      return null;
    }
  }

  /**
   * Display AI insight in a formatted way
   */
  private displayAIInsight(insight: AIInsight): void {
    const aiConfig = this.configManager.getAIConfig();

    // Check confidence threshold
    if (insight.confidence < aiConfig.confidenceThreshold) {
      return; // Don't show low-confidence insights
    }

    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push('Analysis:');
    lines.push(`   ${insight.explanation}`);

    // Likely causes
    if (insight.likelyCauses.length > 0) {
      lines.push('');
      lines.push('Likely Causes:');
      insight.likelyCauses.forEach(cause => {
        lines.push(`   • ${cause}`);
      });
    }

    // Suggested fix
    if (insight.suggestedFix) {
      lines.push('');
      lines.push('Suggested Fix:');
      lines.push(`   ${insight.suggestedFix}`);
    }

    // Contextual insights
    if (insight.contextualInsights.length > 0) {
      lines.push('');
      lines.push('Context:');
      insight.contextualInsights.forEach(context => {
        lines.push(`   • ${context}`);
      });
    }

    // Metadata
    if (insight.cached) {
      lines.push('');
      lines.push('(cached response)');
    } else if (insight.processingTime > 0) {
      lines.push('');
      lines.push(`(${insight.processingTime}ms)`);
    }

    lines.push(''); // Empty line for spacing

    // Output the AI insight
    const aiOutput = lines.join('\n');
    this.writeOutput(aiOutput);
  }

  /**
   * Format a log message (unchanged from original)
   */
  private formatMessage(entry: LogEntry): string {
    return this.formatter.formatLogEntry(entry, this.config);
  }

  /**
   * Write output to the configured stream (unchanged from original)
   */
  private writeOutput(message: string): void {
    this.config.output?.write(message + '\n');
  }

  /**
   * Get source information for the log entry
   */
  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('node_modules') || line.includes('packages/logger')) {
        continue;
      }

      const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName =
          filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
    }

    return 'unknown';
  }

  /**
   * Set the log level (unchanged from original)
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Set configuration (unchanged from original)
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration (unchanged from original)
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Check if a log level is enabled (unchanged from original)
   */
  isEnabled(level: LogLevel): boolean {
    return level <= (this.config.level ?? LogLevel.INFO);
  }

  /**
   * Create a child logger (unchanged from original)
   */
  child(prefix: string): ILogger {
    const childConfig = {
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    };
    return new EnhancedLogger(childConfig);
  }

  // AI-specific methods for enhanced functionality

  /**
   * Manually analyze an error (new AI feature)
   */
  async analyzeError(error: Error): Promise<ErrorAnalysis> {
    if (!this.aiService) {
      throw new Error(
        'AI service not available. Please configure an AI provider.'
      );
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

  /**
   * Get AI insight for an error (new AI feature)
   */
  async getInsight(error: Error): Promise<AIInsight | null> {
    if (!this.aiService) {
      return null;
    }

    try {
      return await this.aiService.analyzeError(error);
    } catch {
      return null;
    }
  }

  /**
   * Enable AI features (new AI feature)
   */
  enableAI(config?: any): void {
    if (config) {
      this.configManager.updateConfig({ ai: config });
    }
    this.initializeAI();
  }

  /**
   * Disable AI features (new AI feature)
   */
  disableAI(): void {
    this.aiService = null;
  }

  /**
   * Check if AI is available and working (new AI feature)
   */
  async isAIHealthy(): Promise<boolean> {
    if (!this.aiService) {
      return false;
    }
    return await this.aiService.isHealthy();
  }

  /**
   * Test the AI service (new AI feature)
   */
  async testAI(): Promise<{ success: boolean; message: string }> {
    if (!this.aiService) {
      return {
        success: false,
        message: 'AI service not initialized. Please configure an AI provider.',
      };
    }

    return await this.aiService.testProvider();
  }

  /**
   * Get AI service statistics (new AI feature)
   */
  getAIStats(): any {
    if (!this.aiService) {
      return null;
    }
    return this.aiService.getStats();
  }

  /**
   * Switch AI provider (new AI feature)
   */
  async switchAIProvider(
    provider: 'ollama' | 'openai' | 'claude' | 'disabled'
  ): Promise<void> {
    if (this.aiService) {
      await this.aiService.switchProvider(provider);
    }
    this.initializeAI();
  }

  // Console Compatibility Methods (inherited from base Logger + AI enhancements)

  /**
   * Console.log compatible method with AI analysis for errors
   *
   * Processes multiple arguments like console.log but with enhanced error analysis.
   * If any argument is an Error object, AI analysis is automatically triggered.
   *
   * @param args - Any number of arguments, processed like console.log
   */
  logConsole(...args: any[]): void {
    const { message, data } = processConsoleArgsWithFormatting(args);

    // Check if any argument is an Error for potential AI analysis
    const hasError = args.some(arg => arg instanceof Error);
    if (hasError) {
      this.logWithAI(LogLevel.INFO, message, data);
    } else {
      this.info(message, data);
    }
  }

  /**
   * Console.warn compatible method with AI analysis
   */
  warnConsole(...args: any[]): void {
    const { message, data } = processConsoleArgsWithFormatting(args);
    this.logWithAI(LogLevel.WARN, message, data);
  }

  /**
   * Console.error compatible method with AI analysis
   */
  errorConsole(...args: any[]): void {
    const { message, data } = processConsoleArgsWithFormatting(args);
    this.logWithAI(LogLevel.ERROR, message, data);
  }

  /**
   * Console.info compatible method with AI analysis for errors
   */
  infoConsole(...args: any[]): void {
    const { message, data } = processConsoleArgsWithFormatting(args);

    // Check if any argument is an Error for potential AI analysis
    const hasError = args.some(arg => arg instanceof Error);
    if (hasError) {
      this.logWithAI(LogLevel.INFO, message, data);
    } else {
      this.info(message, data);
    }
  }

  /**
   * Console.debug compatible method
   */
  debugConsole(...args: any[]): void {
    const { message, data } = processConsoleArgsWithFormatting(args);
    this.debug(message, data);
  }
}
