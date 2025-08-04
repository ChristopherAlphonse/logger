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
import { ConfigManager } from './config-manager';
import { AICache } from './ai-cache';
import { createInternalLogger } from './internalLogger';

const internalLogger = createInternalLogger('[AI-SERVICE]');

export class AIService implements IAIService {
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

  private async initialize(): Promise<void> {
    const config = this.configManager.getAIConfig();

    switch (config.provider) {
      case 'ollama':
        this.ollama = new Ollama({
          host: config.ollama?.baseUrl || 'http://localhost:11434',
        });
        break;
      case 'openai':
        if (config.openai?.apiKey) {
          this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
            organization: config.openai.organization,
          });
        }
        break;
      case 'claude':
        throw new Error(
          'Claude integration not yet available. Use "ollama" or "openai" instead.'
        );
    }
  }

  async isHealthy(): Promise<boolean> {
    const config = this.configManager.getAIConfig();

    try {
      switch (config.provider) {
        case 'ollama':
          if (!this.ollama) return false;
          await this.ollama.list();
          return true;

        case 'openai':
          if (!this.openai) return false;
          await this.openai.models.list();
          return true;

        case 'claude':
          return false; // Claude integration not yet available

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

  async analyzeError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const config = this.configManager.getAIConfig();

    // Check cache first
    if (config.caching) {
      const cacheKey = AICache.generateErrorKey(error, context);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Generate insight
    const insight = await this.generateInsight(error, context);
    insight.processingTime = Date.now() - startTime;

    // Cache the result
    if (config.caching) {
      const cacheKey = AICache.generateErrorKey(error, context);
      await this.cache.set(cacheKey, insight);
    }

    this.recordRequest();
    return insight;
  }

  async analyzeStackTrace(
    stackTrace: StackFrame[],
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const startTime = Date.now();
    const config = this.configManager.getAIConfig();

    // Check cache first
    if (config.caching) {
      const cacheKey = AICache.generateStackTraceKey(stackTrace, context);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Generate insight
    const framework = this.detectFramework(stackTrace, '');
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
  }

  detectFramework(
    stackTrace: StackFrame[],
    errorMessage: string
  ): FrameworkContext {
    const message = errorMessage.toLowerCase();
    const files = stackTrace.map(frame => frame.fileName?.toLowerCase() || '');

    if (files.some(f => f.includes('react') || f.includes('jsx')))
      return 'react';
    if (files.some(f => f.includes('next'))) return 'next';
    if (files.some(f => f.includes('express'))) return 'express';
    if (files.some(f => f.includes('fastify'))) return 'fastify';
    if (files.some(f => f.includes('nest'))) return 'nest';
    if (files.some(f => f.includes('vue'))) return 'vue';
    if (files.some(f => f.includes('angular'))) return 'angular';
    if (message.includes('document') || message.includes('window'))
      return 'browser';
    if (files.some(f => f.includes('node_modules'))) return 'node';

    return 'unknown' as FrameworkContext;
  }

  private async generateInsight(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const config = this.configManager.getAIConfig();
    const framework = this.detectFramework([], error.message) || 'unknown';

    try {
      switch (config.provider) {
        case 'ollama':
          return await this.generateOllamaInsight(error, framework, context);
        case 'openai':
          return await this.generateOpenAIInsight(error, framework, context);
        case 'claude':
          return await this.generateClaudeInsight(error, framework, context);
        default:
          return this.generateBasicInsight(error, framework);
      }
    } catch (aiError) {
      // Fallback to basic insights if AI fails
      internalLogger.warn(
        'AI analysis failed, falling back to basic insights',
        { aiError, errorMessage: error.message }
      );
      return this.generateBasicInsight(error, framework);
    }
  }

  private async generateOllamaInsight(
    error: Error,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    if (!this.ollama) {
      throw new Error('Ollama not initialized');
    }

    const config = this.configManager.getAIConfig();
    const prompt = this.buildErrorAnalysisPrompt(error, framework, context);

    const response = await this.ollama.generate({
      model: config.ollama?.model || 'llama3.2:3b',
      prompt,
      options: {
        temperature: config.ollama?.temperature || 0.7,
        num_predict: config.ollama?.maxTokens || 1000,
      },
    });

    return this.parseAIResponse(response.response, framework);
  }

  private async generateOpenAIInsight(
    error: Error,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const config = this.configManager.getAIConfig();
    const prompt = this.buildErrorAnalysisPrompt(error, framework, context);

    const response = await this.openai.chat.completions.create(
      {
        model: config.openai?.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        temperature: config.openai?.temperature || 0.7,
        max_tokens: config.openai?.maxTokens || 1000,
      },
      { timeout: config.timeout }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseAIResponse(content, framework);
  }

  private async generateClaudeInsight(
    error: Error,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    throw new Error(
      'Claude integration not yet available. Use "ollama" or "openai" instead.'
    );
  }

  private async generateStackTraceInsight(
    stackTrace: StackFrame[],
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const config = this.configManager.getAIConfig();
    const prompt = this.buildStackTraceAnalysisPrompt(
      stackTrace,
      framework,
      context
    );

    switch (config.provider) {
      case 'ollama':
        if (!this.ollama) throw new Error('Ollama not initialized');
        const response = await this.ollama.generate({
          model: config.ollama?.model || 'llama3.2:3b',
          prompt,
          options: {
            temperature: config.ollama?.temperature || 0.7,
            num_predict: config.ollama?.maxTokens || 1000,
          },
        });
        return this.parseAIResponse(response.response, framework);

      case 'openai':
        if (!this.openai) throw new Error('OpenAI not initialized');
        const openaiResponse = await this.openai.chat.completions.create(
          {
            model: config.openai?.model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              { role: 'user', content: prompt },
            ],
            temperature: config.openai?.temperature || 0.7,
            max_tokens: config.openai?.maxTokens || 1000,
          },
          { timeout: config.timeout }
        );
        const content = openaiResponse.choices[0]?.message?.content;
        if (!content) throw new Error('No response from OpenAI');
        return this.parseAIResponse(content, framework);

      default:
        return this.generateBasicInsight(
          new Error('Stack trace analysis'),
          framework
        );
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert JavaScript/TypeScript debugger. Analyze the provided error or stack trace and provide helpful insights in the following JSON format:

{
  "explanation": "Brief explanation of what went wrong",
  "likelyCauses": ["cause1", "cause2", "cause3"],
  "suggestedFix": "Specific actionable fix",
  "contextualInsights": ["insight1", "insight2"],
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
}

Be concise, precise, and helpful. Focus on practical solutions.`;
  }

  private buildErrorAnalysisPrompt(
    error: Error,
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): string {
    // Sanitize error data to prevent injection attacks
    const sanitizedError = {
      name: this.sanitizeString(error.name),
      message: this.sanitizeString(error.message),
      stack: this.sanitizeString(error.stack || ''),
    };

    const sanitizedContext = this.sanitizeContext(context);

    return `Analyze this JavaScript/TypeScript error:

Error: ${sanitizedError.name}: ${sanitizedError.message}
Stack: ${sanitizedError.stack}
Framework: ${framework}
Context: ${JSON.stringify(sanitizedContext, null, 2)}

Provide analysis in JSON format.`;
  }

  private buildStackTraceAnalysisPrompt(
    stackTrace: StackFrame[],
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): string {
    // Sanitize stack trace data
    const sanitizedStackTrace = stackTrace.map(frame => ({
      functionName: this.sanitizeString(frame.functionName || 'anonymous'),
      fileName: this.sanitizeString(frame.fileName || ''),
      lineNumber: typeof frame.lineNumber === 'number' ? frame.lineNumber : 0,
    }));

    const stackStr = sanitizedStackTrace
      .map(
        frame =>
          `${frame.functionName} at ${frame.fileName}:${frame.lineNumber}`
      )
      .join('\n');

    const sanitizedContext = this.sanitizeContext(context);

    return `Analyze this JavaScript/TypeScript stack trace:

Stack Trace:
${stackStr}
Framework: ${framework}
Context: ${JSON.stringify(sanitizedContext, null, 2)}

Provide analysis in JSON format.`;
  }

  private parseAIResponse(
    response: string,
    framework: FrameworkContext
  ): AIInsight {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          explanation: parsed.explanation || 'Error analysis',
          likelyCauses: parsed.likelyCauses || ['Unknown cause'],
          suggestedFix: parsed.suggestedFix || 'Check the error details',
          contextualInsights: parsed.contextualInsights || [],
          confidence: this.parseConfidence(parsed.confidence),
          processingTime: 0,
          cached: false,
          framework,
        };
      }
    } catch (error) {
      internalLogger.warn('Failed to parse AI response', { error, response });
    }

    // Fallback to basic insight
    return {
      explanation: 'AI analysis failed, using basic insight',
      likelyCauses: ['Analysis error'],
      suggestedFix: 'Check the error details manually',
      contextualInsights: ['AI service unavailable'],
      confidence: ConfidenceLevel.LOW,
      processingTime: 0,
      cached: false,
      framework,
    };
  }

  private parseConfidence(confidence: string): ConfidenceLevel {
    switch (confidence?.toUpperCase()) {
      case 'VERY_HIGH':
        return ConfidenceLevel.VERY_HIGH;
      case 'HIGH':
        return ConfidenceLevel.HIGH;
      case 'MEDIUM':
        return ConfidenceLevel.MEDIUM;
      case 'LOW':
        return ConfidenceLevel.LOW;
      default:
        return ConfidenceLevel.MEDIUM;
    }
  }

  private generateBasicInsight(
    error: Error,
    framework: FrameworkContext
  ): AIInsight {
    return {
      explanation: `Basic analysis of ${error.name}: ${error.message}`,
      likelyCauses: ['Unknown cause - AI analysis unavailable'],
      suggestedFix: 'Check the error details and stack trace',
      contextualInsights: ['AI service not available'],
      confidence: ConfidenceLevel.LOW,
      processingTime: 0,
      cached: false,
      framework,
    };
  }

  private checkRateLimit(): boolean {
    const config = this.configManager.getAIConfig();
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean old requests
    this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);

    const recentRequests = this.requestTimes.filter(
      time => time > oneMinuteAgo
    ).length;
    const hourlyRequests = this.requestTimes.length;

    return (
      recentRequests < (config.rateLimit?.maxRequestsPerMinute || 60) &&
      hourlyRequests < (config.rateLimit?.maxRequestsPerHour || 1000)
    );
  }

  private recordRequest(): void {
    this.requestCount++;
    this.requestTimes.push(Date.now());
  }

  getStats(): {
    requestCount: number;
    recentRequests: number;
    provider: string;
    cacheStats: Record<string, unknown>;
  } {
    const config = this.configManager.getAIConfig();
    const recentRequests = this.requestTimes.filter(
      time => time > Date.now() - 60 * 1000
    ).length;

    return {
      requestCount: this.requestCount,
      recentRequests,
      provider: config.provider,
      cacheStats: this.cache.getDetailedStats() as unknown as Record<
        string,
        unknown
      >,
    };
  }

  /**
   * Sanitize string input to prevent injection attacks
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    // Remove or escape potentially dangerous characters
    return input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize context object to prevent injection attacks
   */
  private sanitizeContext(
    context?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!context || typeof context !== 'object' || context === null) return {};

    const sanitized: Record<string, unknown> = {};
    const maxKeys = 50;
    let keyCount = 0;

    for (const [key, value] of Object.entries(context)) {
      if (keyCount >= maxKeys) break;

      const sanitizedKey = this.sanitizeString(key);
      if (sanitizedKey.length === 0) continue;

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (value && typeof value === 'object') {
        // Shallow sanitization for objects to prevent deep nesting attacks
        try {
          const stringified = JSON.stringify(value);
          if (stringified.length < 1000) {
            sanitized[sanitizedKey] = '[Object]';
          }
        } catch {
          sanitized[sanitizedKey] = '[Unserializable]';
        }
      } else if (value !== null && value !== undefined) {
        sanitized[sanitizedKey] = String(value).substring(0, 100);
      }

      keyCount++;
    }

    return sanitized;
  }
}
