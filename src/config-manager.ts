import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { AIConfig } from './types';
import { Logger } from './logger';

// Create a logger instance for internal use
const internalLogger = new Logger({
  level: 1, // WARN level
  timestamps: false,
  colors: true,
  showSource: true, // Show file:line for debugging config issues
  prefix: '[CONFIG]',
});

/**
 * Extended AI configuration with multiple provider support
 */
export interface ExtendedAIConfig extends Omit<AIConfig, 'provider'> {
  /** AI provider to use */
  provider: 'ollama' | 'openai' | 'claude' | 'disabled';
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
}

/**
 * Logger configuration with enhanced AI support
 */
export interface LoggerAIConfig {
  ai: ExtendedAIConfig;
  cache?: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    persistToDisk: boolean;
    cacheDir?: string;
  };
}

/**
 * Default configuration for free local development
 */
const DEFAULT_CONFIG: LoggerAIConfig = {
  ai: {
    enabled: true,
    provider: 'ollama', // Free by default!
    caching: true,
    confidenceThreshold: 1, // MEDIUM
    maxInsightLength: 1000,
    timeout: 30000,
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2:3b', // Lightweight model for fast responses
      temperature: 0.1,
      maxTokens: 1000,
    },
    prompts: {
      errorAnalysis: `You are an expert JavaScript/TypeScript debugger. Analyze this error and provide helpful insights in JSON format:
{
  "summary": "Brief explanation of what went wrong",
  "likelyCauses": ["cause1", "cause2", "cause3"],
  "suggestedFix": "Specific actionable fix",
  "contextualInsights": ["insight1", "insight2"],
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
}`,
    },
    rateLimit: {
      maxRequestsPerMinute: 60, // No limits for local models
      maxRequestsPerHour: 1000,
    },
  },
  cache: {
    enabled: true,
    maxSize: 5000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    persistToDisk: true,
    cacheDir: join(process.cwd(), '.logger-ai-cache'),
  },
};

/**
 * Configuration manager for AI logger
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: LoggerAIConfig;
  private configPath: string;

  private constructor() {
    this.configPath = this.getConfigPath();
    this.config = this.loadConfig();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get the configuration file path
   */
  private getConfigPath(): string {
    // Check for local config first (project-specific)
    const localConfigPath = join(process.cwd(), '.logger-ai.config.json');
    if (existsSync(localConfigPath)) {
      return localConfigPath;
    }

    // Fall back to global config in home directory
    const globalConfigPath = join(homedir(), '.logger-ai.config.json');
    return globalConfigPath;
  }

  /**
   * Load configuration from file or create default
   */
  private loadConfig(): LoggerAIConfig {
    try {
      if (existsSync(this.configPath)) {
        const fileContent = readFileSync(this.configPath, 'utf-8');
        const userConfig = JSON.parse(fileContent);

        // Merge with defaults
        return this.mergeConfigs(DEFAULT_CONFIG, userConfig);
      }
    } catch (error) {
      internalLogger.warn(
        `Failed to load AI logger config from ${this.configPath}`,
        { error, configPath: this.configPath }
      );
    }

    // Return default config
    return DEFAULT_CONFIG;
  }

  /**
   * Deep merge configurations
   */
  private mergeConfigs(
    defaultConfig: LoggerAIConfig,
    userConfig: Partial<LoggerAIConfig>
  ): LoggerAIConfig {
    const merged = { ...defaultConfig };

    if (userConfig.ai) {
      merged.ai = { ...defaultConfig.ai, ...userConfig.ai };

      // Merge provider-specific configs
      if (userConfig.ai.ollama) {
        merged.ai.ollama = {
          ...defaultConfig.ai.ollama,
          ...userConfig.ai.ollama,
        };
      }
      if (userConfig.ai.openai) {
        merged.ai.openai = {
          ...defaultConfig.ai.openai,
          ...userConfig.ai.openai,
        };
      }
      if (userConfig.ai.claude) {
        merged.ai.claude = {
          ...defaultConfig.ai.claude,
          ...userConfig.ai.claude,
        };
      }
      if (userConfig.ai.prompts) {
        merged.ai.prompts = {
          ...defaultConfig.ai.prompts,
          ...userConfig.ai.prompts,
        };
      }
      if (userConfig.ai.rateLimit) {
        merged.ai.rateLimit = {
          ...defaultConfig.ai.rateLimit,
          ...userConfig.ai.rateLimit,
        };
      }
    }

    if (userConfig.cache) {
      merged.cache = { ...defaultConfig.cache, ...userConfig.cache };
    }

    return merged;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerAIConfig {
    return this.config;
  }

  /**
   * Get AI configuration
   */
  getAIConfig(): ExtendedAIConfig {
    return this.config.ai;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LoggerAIConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

  /**
   * Save configuration to file
   */
  saveConfig(): void {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      writeFileSync(this.configPath, configData, 'utf-8');
    } catch (error) {
      internalLogger.error(
        `Failed to save AI logger config to ${this.configPath}`,
        { error, configPath: this.configPath }
      );
    }
  }

  /**
   * Create a sample configuration file for users
   */
  static createSampleConfig(filePath?: string): void {
    const sampleConfig: LoggerAIConfig = {
      ai: {
        enabled: true,
        provider: 'ollama', // Free local AI by default
        caching: true,
        confidenceThreshold: 1, // MEDIUM
        maxInsightLength: 1000,
        timeout: 30000,

        // Ollama configuration (FREE - no API key needed)
        ollama: {
          baseUrl: 'http://localhost:11434',
          model: 'llama3.2:3b', // Fast, lightweight model
          temperature: 0.1,
          maxTokens: 1000,
        },

        // OpenAI configuration (PAID - requires API key)
        openai: {
          apiKey: 'your-openai-api-key-here',
          model: 'gpt-4',
          temperature: 0.1,
          maxTokens: 1000,
          organization: 'your-org-id', // Optional
        },

        // Claude configuration (PAID - requires API key)
        claude: {
          apiKey: 'your-claude-api-key-here',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.1,
          maxTokens: 1000,
        },

        // Custom prompts (optional)
        prompts: {
          errorAnalysis: 'Custom error analysis prompt...',
          stackTraceAnalysis: 'Custom stack trace analysis prompt...',
        },

        // Rate limiting
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxRequestsPerHour: 1000,
        },
      },

      // Cache configuration
      cache: {
        enabled: true,
        maxSize: 5000,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        persistToDisk: true,
        cacheDir: './.logger-ai-cache',
      },
    };

    const targetPath =
      filePath || join(process.cwd(), '.logger-ai.config.json');

    try {
      const configData = JSON.stringify(sampleConfig, null, 2);
      writeFileSync(targetPath, configData, 'utf-8');
      internalLogger.info(`Sample AI logger config created at: ${targetPath}`);
      internalLogger.info('\nGetting started with FREE AI logging:');
      internalLogger.info('1. Install Ollama: https://ollama.ai');
      internalLogger.info('2. Pull a model: ollama pull llama3.2:3b');
      internalLogger.info('3. Start logging with AI insights!');
      internalLogger.info('\nFor cloud AI (OpenAI/Claude):');
      internalLogger.info('1. Add your API key to the config file');
      internalLogger.info('2. Change provider to "openai" or "claude"');
    } catch (error) {
      internalLogger.error(`Failed to create sample config at ${targetPath}`, {
        error,
        targetPath,
      });
    }
  }

  /**
   * Check if a provider is properly configured
   */
  isProviderConfigured(provider: string): boolean {
    const { ai } = this.config;

    switch (provider) {
      case 'ollama':
        return ai.ollama?.baseUrl ? true : false;
      case 'openai':
        return ai.openai?.apiKey ? true : false;
      case 'claude':
        return ai.claude?.apiKey ? true : false;
      case 'disabled':
        return true;
      default:
        return false;
    }
  }

  /**
   * Get provider-specific configuration
   */
  getProviderConfig(provider: string): any {
    const { ai } = this.config;

    switch (provider) {
      case 'ollama':
        return ai.ollama;
      case 'openai':
        return ai.openai;
      case 'claude':
        return ai.claude;
      default:
        return null;
    }
  }

  /**
   * Auto-detect best available provider
   */
  detectBestProvider(): string {
    const { ai } = this.config;

    // Prefer free local models
    if (this.isProviderConfigured('ollama')) {
      return 'ollama';
    }

    // Fall back to cloud providers if configured
    if (this.isProviderConfigured('openai')) {
      return 'openai';
    }

    if (this.isProviderConfigured('claude')) {
      return 'claude';
    }

    // Default to ollama even if not configured (will show helpful error)
    return 'ollama';
  }

  /**
   * Check if AI features are available
   */
  isAIAvailable(): boolean {
    return (
      this.config.ai.enabled &&
      this.isProviderConfigured(this.config.ai.provider)
    );
  }
}
