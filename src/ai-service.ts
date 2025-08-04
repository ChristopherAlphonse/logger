import OpenAI from 'openai';
import { ConfidenceLevel } from './types';
import type {
  AIConfig,
  AIInsight,
  ErrorAnalysis,
  FrameworkContext,
  StackFrame,
  IAIService,
} from './types';
import { AIEngine } from './ai-engine';

/**
 * OpenAI-powered AI service for error analysis
 */
export class AIService implements IAIService {
  private openai: OpenAI | null = null;
  private config: AIConfig;
  private requestCount = 0;
  private requestTimes: number[] = [];

  constructor(config: AIConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the OpenAI client if API key is provided
   */
  private initialize(): void {
    if (this.config.provider === 'openai' && this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Check if the AI service is healthy and ready
   */
  async isHealthy(): Promise<boolean> {
    if (!this.config.enabled || this.config.provider === 'disabled') {
      return false;
    }

    if (this.config.provider === 'openai') {
      if (!this.openai) {
        return false;
      }

      try {
        // Simple health check with minimal API usage
        await this.openai.models.list();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Analyze an error using AI
   */
  async analyzeError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    const startTime = Date.now();

    try {
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

      this.recordRequest();
      return insight;
    } catch (aiError) {
      // Fallback to basic insights if AI fails
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

    try {
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

      this.recordRequest();
      return insight;
    } catch {
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
   * Detect framework context from stack trace and error message
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
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const prompt = this.buildErrorAnalysisPrompt(analysis, framework, context);

    try {
      const completion = await this.openai.chat.completions.create(
        {
          model: 'gpt-4',
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
          temperature: 0.1,
          max_tokens: this.config.maxInsightLength,
        },
        {
          timeout: this.config.timeout,
        }
      );

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      return this.parseAIResponse(response, framework);
    } catch (error) {
      throw new Error(
        `AI analysis failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate AI insight for stack trace analysis
   */
  private async generateStackTraceInsight(
    stackTrace: StackFrame[],
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): Promise<AIInsight> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const prompt = this.buildStackTraceAnalysisPrompt(
      stackTrace,
      framework,
      context
    );

    try {
      const completion = await this.openai.chat.completions.create(
        {
          model: 'gpt-4',
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
          temperature: 0.1,
          max_tokens: this.config.maxInsightLength,
        },
        {
          timeout: this.config.timeout,
        }
      );

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      return this.parseAIResponse(response, framework);
    } catch (error) {
      throw new Error(
        `Stack trace analysis failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
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
- Consider async/await patterns, common pitfalls, and best practices`;
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

    let prompt =
      this.config.prompts?.errorAnalysis ||
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
   * Build the stack trace analysis prompt
   */
  private buildStackTraceAnalysisPrompt(
    stackTrace: StackFrame[],
    framework: FrameworkContext,
    context?: Record<string, unknown>
  ): string {
    const relevantFrames = AIEngine.getRelevantStackFrames(stackTrace, 5);

    let prompt =
      this.config.prompts?.stackTraceAnalysis ||
      `
Analyze this JavaScript/TypeScript stack trace:

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

Focus on identifying the root cause and execution flow. Provide analysis following the JSON format.`;

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
      const parsed = JSON.parse(response);

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
    } catch {
      // Fallback if JSON parsing fails
      return {
        explanation: response.substring(0, 200) + '...',
        likelyCauses: ['AI response parsing failed'],
        suggestedFix: 'Review the error manually',
        contextualInsights: ['AI analysis may be incomplete'],
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
    if (!this.config.rateLimit) {
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
    if (recentRequests.length >= this.config.rateLimit.maxRequestsPerMinute) {
      return false;
    }

    // Check hour limit
    if (this.requestTimes.length >= this.config.rateLimit.maxRequestsPerHour) {
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
   * Update configuration
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  /**
   * Get current statistics
   */
  getStats(): { requestCount: number; recentRequests: number } {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestTimes.filter(
      time => time > oneMinuteAgo
    ).length;

    return {
      requestCount: this.requestCount,
      recentRequests,
    };
  }
}
