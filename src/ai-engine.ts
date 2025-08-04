import { createHash } from 'crypto';
import { ConfidenceLevel } from './types';
import type {
  AIInsight,
  ErrorAnalysis,
  FrameworkContext,
  StackFrame,
  IAIService,
} from './types';

/**
 * Core AI engine for error analysis and insight generation
 */
export class AIEngine {
  /**
   * Parse and analyze a JavaScript error
   */
  public static analyzeError(error: Error): ErrorAnalysis {
    const stackTrace = this.parseStackTrace(error.stack || '');
    const errorType = this.classifyError(error);
    const errorHash = this.generateErrorHash(error);

    return {
      error,
      stackTrace,
      errorType,
      errorHash,
    };
  }

  /**
   * Parse a stack trace string into structured stack frames
   */
  public static parseStackTrace(stackTrace: string): StackFrame[] {
    const frames: StackFrame[] = [];
    const lines = stackTrace.split('\n');

    for (const line of lines) {
      const frame = this.parseStackFrame(line);
      if (frame) {
        frames.push(frame);
      }
    }

    return frames;
  }

  /**
   * Parse a single stack frame line
   */
  private static parseStackFrame(line: string): StackFrame | null {
    // Clean up the line
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('Error:')) {
      return null;
    }

    // Remove "at " prefix
    const withoutAt = cleanLine.replace(/^\s*at\s+/, '');

    // Try to match different stack frame formats
    const patterns = [
      // Function name with file location: functionName (file:line:column)
      /^(.+?)\s+\((.+?):(\d+):(\d+)\)$/,
      // Just file location: file:line:column
      /^(.+?):(\d+):(\d+)$/,
      // Function name only
      /^(.+?)$/,
    ];

    for (const pattern of patterns) {
      const match = withoutAt.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          // Function name with file location
          return {
            functionName: match[1].trim(),
            fileName: match[2],
            lineNumber: parseInt(match[3], 10),
            columnNumber: parseInt(match[4], 10),
            isUserCode: this.isUserCode(match[2]),
          };
        } else if (pattern === patterns[1]) {
          // Just file location
          return {
            fileName: match[1],
            lineNumber: parseInt(match[2], 10),
            columnNumber: parseInt(match[3], 10),
            isUserCode: this.isUserCode(match[1]),
          };
        } else {
          // Function name only
          return {
            functionName: match[1].trim(),
            isUserCode: !this.isFrameworkCode(match[1]),
          };
        }
      }
    }

    return null;
  }

  /**
   * Determine if a file path represents user code vs framework/library code
   */
  private static isUserCode(fileName: string): boolean {
    if (!fileName) return false;

    const frameworkPaths = [
      'node_modules',
      'internal/',
      'webpack:',
      '<anonymous>',
      'native',
      'buffer.js',
      'fs.js',
      'net.js',
      'http.js',
      'https.js',
      'events.js',
      'stream.js',
    ];

    return !frameworkPaths.some(path => fileName.includes(path));
  }

  /**
   * Determine if a function name is from framework/library code
   */
  private static isFrameworkCode(functionName: string): boolean {
    if (!functionName) return false;

    const frameworkFunctions = [
      'Module._compile',
      'Module._load',
      'runMain',
      'Function.Module.runMain',
      'process.nextTick',
      'internal/',
    ];

    return frameworkFunctions.some(fn => functionName.includes(fn));
  }

  /**
   * Classify the type of error
   */
  public static classifyError(error: Error): string {
    const errorName = error.constructor.name;
    const message = error.message.toLowerCase();

    // Built-in JavaScript error types
    if (errorName === 'TypeError') {
      if (
        message.includes('cannot read property') ||
        message.includes('cannot read properties')
      ) {
        return 'PropertyAccessError';
      }
      if (message.includes('is not a function')) {
        return 'FunctionCallError';
      }
      if (message.includes('cannot destructure')) {
        return 'DestructuringError';
      }
      return 'TypeError';
    }

    if (errorName === 'ReferenceError') {
      if (message.includes('is not defined')) {
        return 'UndefinedVariableError';
      }
      return 'ReferenceError';
    }

    if (errorName === 'SyntaxError') {
      return 'SyntaxError';
    }

    if (errorName === 'RangeError') {
      return 'RangeError';
    }

    // Network and async errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'NetworkError';
    }

    if (message.includes('timeout')) {
      return 'TimeoutError';
    }

    if (message.includes('promise') || message.includes('async')) {
      return 'AsyncError';
    }

    // Framework-specific errors
    if (message.includes('react') || message.includes('jsx')) {
      return 'ReactError';
    }

    if (message.includes('express') || message.includes('middleware')) {
      return 'ExpressError';
    }

    if (message.includes('database') || message.includes('sql')) {
      return 'DatabaseError';
    }

    return errorName || 'UnknownError';
  }

  /**
   * Detect the framework context from stack trace and error message
   */
  public static detectFramework(
    stackTrace: StackFrame[],
    errorMessage: string
  ): FrameworkContext {
    const allText = `${errorMessage} ${JSON.stringify(
      stackTrace
    )}`.toLowerCase();

    // Check for React
    if (
      allText.includes('react') ||
      allText.includes('jsx') ||
      allText.includes('usestate') ||
      allText.includes('useeffect') ||
      allText.includes('component')
    ) {
      if (allText.includes('next')) {
        return 'next';
      }
      return 'react';
    }

    // Check for Vue
    if (allText.includes('vue') || allText.includes('vuex')) {
      return 'vue';
    }

    // Check for Angular
    if (allText.includes('angular') || allText.includes('@angular')) {
      return 'angular';
    }

    // Check for Express
    if (
      allText.includes('express') ||
      allText.includes('middleware') ||
      allText.includes('req.') ||
      allText.includes('res.')
    ) {
      return 'express';
    }

    // Check for Fastify
    if (allText.includes('fastify')) {
      return 'fastify';
    }

    // Check for NestJS
    if (allText.includes('nest') || allText.includes('@nestjs')) {
      return 'nest';
    }

    // Check for Next.js specific patterns
    if (
      allText.includes('next') ||
      allText.includes('getstaticprops') ||
      allText.includes('getserversideprops')
    ) {
      return 'next';
    }

    // Check if it's Node.js
    if (
      allText.includes('node_modules') ||
      allText.includes('require(') ||
      allText.includes('module.exports') ||
      allText.includes('process.')
    ) {
      return 'node';
    }

    // Check if it's browser
    if (
      allText.includes('window') ||
      allText.includes('document') ||
      allText.includes('browser') ||
      allText.includes('dom')
    ) {
      return 'browser';
    }

    return 'unknown';
  }

  /**
   * Generate a unique hash for an error for caching purposes
   */
  public static generateErrorHash(error: Error): string {
    const key = `${error.name}:${error.message}:${
      error.stack?.split('\n')[1] || ''
    }`;
    return createHash('md5').update(key).digest('hex').substring(0, 12);
  }

  /**
   * Extract the most relevant stack frames (user code)
   */
  public static getRelevantStackFrames(
    stackTrace: StackFrame[],
    maxFrames = 5
  ): StackFrame[] {
    // Prioritize user code frames
    const userFrames = stackTrace.filter(frame => frame.isUserCode);
    const frameworkFrames = stackTrace.filter(frame => !frame.isUserCode);

    // Return a mix of user and framework frames, prioritizing user code
    const result: StackFrame[] = [];

    // Add user frames first
    result.push(
      ...userFrames.slice(0, Math.min(maxFrames - 1, userFrames.length))
    );

    // Fill remaining slots with framework frames if needed
    const remainingSlots = maxFrames - result.length;
    if (remainingSlots > 0) {
      result.push(...frameworkFrames.slice(0, remainingSlots));
    }

    return result;
  }

  /**
   * Generate a human-readable summary of the error
   */
  public static generateErrorSummary(analysis: ErrorAnalysis): string {
    const { error, errorType, stackTrace } = analysis;
    const relevantFrames = this.getRelevantStackFrames(stackTrace, 3);

    let summary = `${errorType}: ${error.message}`;

    if (relevantFrames.length > 0) {
      const topFrame = relevantFrames[0];
      if (topFrame.fileName && topFrame.lineNumber) {
        summary += ` at ${topFrame.fileName}:${topFrame.lineNumber}`;
      } else if (topFrame.functionName) {
        summary += ` in ${topFrame.functionName}`;
      }
    }

    return summary;
  }

  /**
   * Generate basic insights without AI for fallback
   */
  public static generateBasicInsight(analysis: ErrorAnalysis): AIInsight {
    const { error, errorType, stackTrace } = analysis;
    const framework = this.detectFramework(stackTrace, error.message);

    let explanation = 'An error occurred in your application.';
    let likelyCauses: string[] = ['Unknown cause'];
    let suggestedFix =
      'Check the error message and stack trace for more details.';
    let contextualInsights: string[] = [];

    // Generate insights based on error type
    switch (errorType) {
      case 'PropertyAccessError':
        explanation =
          "You're trying to access a property on an object that is null or undefined.";
        likelyCauses = [
          "An async operation hasn't completed yet",
          "A variable wasn't properly initialized",
          'An API call returned null/undefined',
          "Optional chaining wasn't used where needed",
        ];
        suggestedFix =
          'Add null checks using optional chaining (?.) or conditional statements before accessing properties.';
        break;

      case 'FunctionCallError':
        explanation = "You're trying to call something that isn't a function.";
        likelyCauses = [
          'The variable is undefined or null',
          "The function hasn't been imported properly",
          'A typo in the function name',
          "The function is defined after it's being called",
        ];
        suggestedFix =
          'Check that the function exists and is properly imported. Verify the spelling and scope.';
        break;

      case 'UndefinedVariableError':
        explanation =
          "You're trying to use a variable that hasn't been declared.";
        likelyCauses = [
          'The variable name is misspelled',
          'The variable is out of scope',
          'The import statement is missing',
          "The variable hasn't been declared yet",
        ];
        suggestedFix =
          "Check the variable name spelling and ensure it's properly declared or imported.";
        break;

      case 'NetworkError':
        explanation = 'A network request failed to complete successfully.';
        likelyCauses = [
          'The server is unreachable',
          'CORS policy blocking the request',
          'Invalid URL or endpoint',
          'Network connectivity issues',
        ];
        suggestedFix =
          'Check the network connection, URL validity, and server status. Handle errors with try-catch.';
        break;

      case 'ReactError':
        explanation = 'An error occurred in your React application.';
        likelyCauses = [
          'State update on unmounted component',
          'Invalid JSX syntax',
          'Missing key prop in list items',
          'Incorrect hook usage',
        ];
        suggestedFix =
          'Check component lifecycle, JSX syntax, and React hooks usage patterns.';
        contextualInsights.push(
          'React errors often relate to component state management or JSX rendering issues.'
        );
        break;
    }

    // Add framework-specific insights
    if (framework !== 'unknown') {
      contextualInsights.push(
        `This error occurred in a ${framework} application context.`
      );

      if (framework === 'react') {
        contextualInsights.push(
          'Consider using React Error Boundaries to handle component errors gracefully.'
        );
      } else if (framework === 'express') {
        contextualInsights.push(
          'Ensure proper error handling middleware is configured in your Express app.'
        );
      } else if (framework === 'next') {
        contextualInsights.push(
          'Check Next.js error pages and consider using error boundaries for client-side errors.'
        );
      }
    }

    return {
      explanation,
      likelyCauses,
      suggestedFix,
      contextualInsights,
      confidence: ConfidenceLevel.MEDIUM,
      processingTime: 0,
      cached: false,
      framework,
    };
  }
}
