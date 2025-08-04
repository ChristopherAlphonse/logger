import OpenAI from 'openai';
import { Ollama } from 'ollama';
import { ConfidenceLevel, LogLevel } from './types';
import type {
  AIInsight,
  ErrorAnalysis,
  FrameworkContext,
  StackFrame,
  IAIService,
} from './types';
import { AIEngine } from './ai-engine';
import { ConfigManager, type ExtendedAIConfig } from './config-manager';
import { AICache } from './ai-cache';
import { Logger } from './logger';

// Create internal logger for AI service debugging
const internalLogger = new Logger({
  level: LogLevel.WARN,
  timestamps: false,
  colors: true,
  showSource: true,
  prefix: '[AI-SERVICE]',
});

/**
 * Enhanced AI service supporting multiple providers (Ollama, OpenAI, Claude)
 * with free local AI as the default
 */
export class EnhancedAIService implements IAIService {
  private configManager: ConfigManager;
  private cache: AICache;
  private ollama: Ollama | null = null;
  private openai: OpenAI | null = null;
  private requestCount = 0;
  private requestTimes: number[] = [];

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.cache = new AICache();
    this.initialize();
  }

  /**
   * Initialize all configured AI providers
   */
  private async initialize(): Promise<void> {
    const config = this.configManager.getAIConfig();

    // Initialize Ollama (free local AI)
    if (config.ollama?.baseUrl) {
      this.ollama = new Ollama({
        host: config.ollama.baseUrl,
      });
    }

    // Initialize OpenAI if configured
    if (config.openai?.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
        organization: config.openai.organization,
      });
    }

    // Preload common patterns into cache
    await this.cache.preloadCommonPatterns();
  }

  /**
   * Check if the AI service is healthy and ready
   */
  async isHealthy(): Promise<boolean> {
    const config = this.configManager.getAIConfig();

    if (!config.enabled || config.provider === 'disabled') {
      return false;
    }

    try {
      switch (config.provider) {
        case 'ollama':
          if (!this.ollama) return false;
          await this.ollama.list(); // Simple health check
          return true;

        case 'openai':
          if (!this.openai) return false;
          await this.openai.models.list();
          return true;

        case 'claude':
          // TODO: Add Claude health check when implementing
          return false;

        default:
          return false;
      }
    } catch (error) {
      internalLogger.warn(
        `AI provider ${config.provider} health check failed`,
        { provider: config.provider, error }
      );
      return false;
    }
  }

  /**
   * Analyze an error using AI with caching
   */
  async analyzeError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const config = this.configManager.getAIConfig();

    try {
      // Check cache first
      if (config.caching) {
        const cacheKey = AICache.generateErrorKey(error, context);
        const cachedInsight = await this.cache.get(cacheKey);
        if (cachedInsight) {
          return cachedInsight;
        }
      }

      // Check rate limits
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      // Parse the error first
      const analysis = AIEngine.analyzeError(error);
      const framework = AIEngine.detectFramework(
        analysis.stackTrace,
        error.message
      );

      // Generate AI insight
      const insight = await this.generateInsight(analysis, framework, context);
      insight.processingTime = Date.now() - startTime;

      // Cache the result
      if (config.caching) {
        const cacheKey = AICache.generateErrorKey(error, context);
        await this.cache.set(cacheKey, insight);
      }

      this.recordRequest();
      return insight;
    } catch (aiError) {
      // Fallback to basic insights if AI fails
      internalLogger.warn(
        'AI analysis failed, falling back to basic insights',
        { aiError, errorMessage: error.message }
      );
      const analysis = AIEngine.analyzeError(error);
      const basicInsight = AIEngine.generateBasicInsight(analysis);
      basicInsight.processingTime = Date.now() - startTime;
      return basicInsight;
    }
  }

  /**
   * Analyze a stack trace using AI
   */
  async analyzeStackTrace(
    stackTrace: StackFrame[],
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const config = this.configManager.getAIConfig();

    try {
      // Check cache first
      if (config.caching) {
        const cacheKey = AICache.generateStackTraceKey(stackTrace, context);
        const cachedInsight = await this.cache.get(cacheKey);
        if (cachedInsight) {
          return cachedInsight;
        }
      }

      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      const framework = AIEngine.detectFramework(stackTrace, '');
      const insight = await this.generateStackTraceInsight(
        stackTrace,
        framework,
        context
      );
      insight.processingTime = Date.now() - startTime;

      // Cache the result
      if (config.caching) {
        const cacheKey = AICache.generateStackTraceKey(stackTrace, context);
        await this.cache.set(cacheKey, insight);
      }

      this.recordRequest();
      return insight;
    } catch (error) {
      // Fallback insight
      return {
        explanation: 'Stack trace analysis unavailable',
        likelyCauses: ['AI service unavailable'],
        suggestedFix: 'Review the stack trace manually for error patterns',
        contextualInsights: [],
        confidence: ConfidenceLevel.LOW,
        processingTime: Date.now() - startTime,
        cached: false,
        framework: AIEngine.detectFramework(stackTrace, ''),
      };
    }
  }

  /**
   * Detect framework context
   */
  detectFramework(
    stackTrace: StackFrame[],
    errorMessage: string
  ): FrameworkContext {
    return AIEngine.detectFramework(stackTrace, errorMessage);
  }

  /**
   * Generate AI insight for an error analysis
   */
  private async generateInsight(
    analysis: ErrorAnalysis,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const config = this.configManager.getAIConfig();

    switch (config.provider) {
      case 'ollama':
        return this.generateOllamaInsight(analysis, framework, context);
      case 'openai':
        return this.generateOpenAIInsight(analysis, framework, context);
      case 'claude':
        return this.generateClaudeInsight(analysis, framework, context);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Generate insight using Ollama (free local AI)
   */
  private async generateOllamaInsight(
    analysis: ErrorAnalysis,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    if (!this.ollama) {
      throw new Error(
        "Ollama not initialized. Please install Ollama and ensure it's running."
      );
    }

    const config = this.configManager.getAIConfig();
    const prompt = this.buildErrorAnalysisPrompt(analysis, framework, context);

    try {
      const response = await this.ollama.chat({
        model: config.ollama?.model || 'llama3.2:3b',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        options: {
          temperature: config.ollama?.temperature || 0.1,
          num_predict: config.ollama?.maxTokens || 1000,
        },
      });

      const responseContent = response.message.content;
      if (!responseContent) {
        throw new Error('No response from Ollama');
      }

      return this.parseAIResponse(responseContent, framework);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Provide helpful guidance for common Ollama issues
      if (
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect')
      ) {
        throw new Error(
          'Cannot connect to Ollama. Please ensure Ollama is installed and running:\n' +
            '1. Install Ollama: https://ollama.ai\n' +
            '2. Pull a model: ollama pull llama3.2:3b\n' +
            '3. Start Ollama service\n' +
            'Original error: ' +
            errorMessage
        );
      }

      throw new Error(`Ollama analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Generate insight using OpenAI
   */
  private async generateOpenAIInsight(
    analysis: ErrorAnalysis,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    if (!this.openai) {
      throw new Error(
        'OpenAI not initialized. Please add your API key to the config.'
      );
    }

    const config = this.configManager.getAIConfig();
    const prompt = this.buildErrorAnalysisPrompt(analysis, framework, context);

    try {
      const completion = await this.openai.chat.completions.create(
        {
          model: config.openai?.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: config.openai?.temperature || 0.1,
          max_tokens: config.openai?.maxTokens || 1000,
        },
        {
          timeout: config.timeout,
        }
      );

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(response, framework);
    } catch (error) {
      throw new Error(
        `OpenAI analysis failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate insight using Claude (placeholder)
   */
  private async generateClaudeInsight(
    analysis: ErrorAnalysis,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    // TODO: Implement Claude integration
    throw new Error(
      'Claude integration not yet implemented. Please use Ollama (free) or OpenAI.'
    );
  }

  /**
   * Generate AI insight for stack trace analysis
   */
  private async generateStackTraceInsight(
    stackTrace: StackFrame[],
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const config = this.configManager.getAIConfig();

    // For now, use the same provider logic as error analysis
    // This could be specialized per provider in the future
    const mockAnalysis: ErrorAnalysis = {
      error: new Error('Stack trace analysis'),
      stackTrace,
      errorType: 'StackTraceAnalysis',
      errorHash: 'stack-trace',
    };

    return this.generateInsight(mockAnalysis, framework, context);
  }

  /**
   * Get the system prompt for AI analysis
   */
  private getSystemPrompt(): string {
    return `You are an expert JavaScript/TypeScript developer and debugger. You help developers understand errors, stack traces, and runtime behavior.

Your responses must be in this exact JSON format:
{
  "summary": "Brief explanation of what went wrong",
  "likelyCauses": ["cause1", "cause2", "cause3"],
  "suggestedFix": "Specific actionable fix or next step",
  "contextualInsights": ["insight1", "insight2"],
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
}

Guidelines:
- Be concise but thorough
- Focus on practical, actionable advice
- Include framework-specific insights when relevant
- Explain complex concepts in simple terms
- Prioritize the most likely causes
- Provide specific code examples when helpful
- Consider async/await patterns, common pitfalls, and best practices
- Always respond with valid JSON`;
  }

  /**
   * Build the error analysis prompt
   */
  private buildErrorAnalysisPrompt(
    analysis: ErrorAnalysis,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): string {
    const { error, errorType, stackTrace } = analysis;
    const relevantFrames = AIEngine.getRelevantStackFrames(stackTrace, 5);
    const config = this.configManager.getAIConfig();

    let prompt =
      config.prompts?.errorAnalysis ||
      `
Analyze this JavaScript/TypeScript error:

Error Type: ${errorType}
Error Message: ${error.message}
Error Name: ${error.name}

Stack Trace:
${relevantFrames
  .map(frame => {
    let frameStr = '';
    if (frame.functionName) frameStr += `Function: ${frame.functionName}\n`;
    if (frame.fileName) frameStr += `File: ${frame.fileName}`;
    if (frame.lineNumber) frameStr += `:${frame.lineNumber}`;
    if (frame.columnNumber) frameStr += `:${frame.columnNumber}`;
    frameStr += `\nUser Code: ${frame.isUserCode ? 'Yes' : 'No'}\n`;
    return frameStr;
  })
  .join('\n---\n')}

Framework Context: ${framework}
${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Please provide a detailed analysis following the JSON format specified in the system prompt.`;

    return prompt.trim();
  }

  /**
   * Parse AI response into structured insight
   */
  private parseAIResponse(
    response: string,
    framework: FrameworkContext
  ): AIInsight {
    try {
      // Try to extract JSON from response (sometimes models add extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;

      const parsed = JSON.parse(jsonStr);

      // Map confidence string to enum
      let confidence = ConfidenceLevel.MEDIUM;
      switch (parsed.confidence?.toUpperCase()) {
        case 'LOW':
          confidence = ConfidenceLevel.LOW;
          break;
        case 'MEDIUM':
          confidence = ConfidenceLevel.MEDIUM;
          break;
        case 'HIGH':
          confidence = ConfidenceLevel.HIGH;
          break;
        case 'VERY_HIGH':
          confidence = ConfidenceLevel.VERY_HIGH;
          break;
      }

      return {
        explanation: parsed.summary || 'No explanation provided',
        likelyCauses: Array.isArray(parsed.likelyCauses)
          ? parsed.likelyCauses
          : [],
        suggestedFix: parsed.suggestedFix || 'No suggested fix provided',
        contextualInsights: Array.isArray(parsed.contextualInsights)
          ? parsed.contextualInsights
          : [],
        confidence,
        processingTime: 0, // Will be set by caller
        cached: false,
        framework,
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        explanation: response.substring(0, 200) + '...',
        likelyCauses: ['AI response parsing failed'],
        suggestedFix: 'Review the error manually',
        contextualInsights: [
          'AI analysis may be incomplete due to parsing error',
        ],
        confidence: ConfidenceLevel.LOW,
        processingTime: 0,
        cached: false,
        framework,
      };
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(): boolean {
    const config = this.configManager.getAIConfig();

    if (!config.rateLimit) {
      return true;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean old requests
    this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);

    const recentRequests = this.requestTimes.filter(
      time => time > oneMinuteAgo
    );

    // Check minute limit
    if (recentRequests.length >= config.rateLimit.maxRequestsPerMinute) {
      return false;
    }

    // Check hour limit
    if (this.requestTimes.length >= config.rateLimit.maxRequestsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Record a request for rate limiting
   */
  private recordRequest(): void {
    this.requestCount++;
    this.requestTimes.push(Date.now());
  }

  /**
   * Get current statistics
   */
  getStats(): {
    requestCount: number;
    recentRequests: number;
    provider: string;
    cacheStats: any;
  } {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestTimes.filter(
      time => time > oneMinuteAgo
    ).length;

    return {
      requestCount: this.requestCount,
      recentRequests,
      provider: this.configManager.getAIConfig().provider,
      cacheStats: this.cache.getDetailedStats(),
    };
  }

  /**
   * Switch AI provider
   */
  async switchProvider(
    provider: 'ollama' | 'openai' | 'claude' | 'disabled'
  ): Promise<void> {
    const config = this.configManager.getAIConfig();
    config.provider = provider;
    this.configManager.updateConfig({ ai: config });
    await this.initialize();
  }

  /**
   * Test the current AI provider
   */
  async testProvider(): Promise<{ success: boolean; message: string }> {
    try {
      const testError = new Error('Test error for AI analysis');
      testError.stack = 'Error: Test error\n    at testFunction (test.js:1:1)';

      const insight = await this.analyzeError(testError);

      return {
        success: true,
        message: `${
          this.configManager.getAIConfig().provider
        } is working correctly! Got insight: "${insight.explanation.substring(
          0,
          50
        )}..."`,
      };
    } catch (error) {
      return {
        success: false,
        message: `${this.configManager.getAIConfig().provider} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }
}
