import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { request } from 'http';
import type { AIConfig } from './types';

import { createInternalLogger } from './internalLogger';

const internalLogger = createInternalLogger('[CONFIG]');

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

const DEFAULT_CONFIG: LoggerAIConfig = {
  ai: {
    enabled: true,
    provider: 'ollama', // Default to free local Ollama
    apiKey: '',
    caching: true,
    confidenceThreshold: 1, // MEDIUM confidence
    maxInsightLength: 500,
    timeout: 10000,
    translateLogs: false, // Disabled by default
    translateLogLevels: [0, 1], // ERROR and WARN levels by default
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2:3b',
      temperature: 0.7,
      maxTokens: 1000,
    },
    openai: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
    },
    claude: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000,
    },
    prompts: {
      logTranslation: undefined, // Will use default prompt
    },
    rateLimit: {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
    },
  },
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 60 * 60 * 1000, // 1 hour
    persistToDisk: false,
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: LoggerAIConfig;
  private configPath: string;

  private constructor() {
    this.configPath = this.getConfigPath();
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getConfigPath(): string {
    // Try local config first, then global
    const localConfig = join(process.cwd(), '.logger-ai.config.json');
    const globalConfig = join(homedir(), '.logger-ai.config.json');

    return existsSync(localConfig) ? localConfig : globalConfig;
  }

  private loadConfig(): LoggerAIConfig {
    try {
      if (existsSync(this.configPath)) {
        const fileContent = readFileSync(this.configPath, 'utf-8');

        // Validate file size (prevent DoS)
        if (fileContent.length > 100000) {
          // 100KB limit
          internalLogger.warn('Config file too large, using defaults', {
            configPath: this.configPath,
          });
          return DEFAULT_CONFIG;
        }

        const userConfig = JSON.parse(fileContent);

        // Validate config structure
        if (!this.isValidConfig(userConfig)) {
          internalLogger.warn('Invalid config structure, using defaults', {
            configPath: this.configPath,
          });
          return DEFAULT_CONFIG;
        }

        return this.mergeConfigs(DEFAULT_CONFIG, userConfig);
      }
    } catch (error) {
      internalLogger.warn(
        `Failed to load AI logger config from ${this.configPath}`,
        { error, configPath: this.configPath }
      );
    }
    return DEFAULT_CONFIG;
  }

  private mergeConfigs(
    defaultConfig: LoggerAIConfig,
    userConfig: Partial<LoggerAIConfig>
  ): LoggerAIConfig {
    const merged = { ...defaultConfig };

    // Merge AI config
    if (userConfig.ai) {
      merged.ai = {
        ...merged.ai,
        ...userConfig.ai,
        // Deep merge provider-specific configs
        ollama: { ...merged.ai.ollama, ...userConfig.ai.ollama },
        openai: { ...merged.ai.openai, ...userConfig.ai.openai },
        claude: { ...merged.ai.claude, ...userConfig.ai.claude },
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxRequestsPerHour: 1000,
          ...merged.ai.rateLimit,
          ...userConfig.ai.rateLimit,
        },
      };
    }

    // Merge cache config
    if (userConfig.cache) {
      merged.cache = { ...merged.cache, ...userConfig.cache };
    }

    return merged;
  }

  getConfig(): LoggerAIConfig {
    return { ...this.config };
  }

  getAIConfig(): ExtendedAIConfig {
    return { ...this.config.ai };
  }

  updateConfig(updates: Partial<LoggerAIConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

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

  static createSampleConfig(filePath?: string): void {
    const sampleConfig = {
      ai: {
        enabled: true,
        provider: 'ollama',
        apiKey: '',
        caching: true,
        confidenceThreshold: 1,
        maxInsightLength: 500,
        timeout: 10000,
        ollama: {
          baseUrl: 'http://localhost:11434',
          model: 'llama3.2:3b',
          temperature: 0.7,
          maxTokens: 1000,
        },
        openai: {
          apiKey: 'your-openai-api-key-here',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
        },
        claude: {
          apiKey: 'your-claude-api-key-here',
          model: 'claude-3-haiku-20240307',
          temperature: 0.7,
          maxTokens: 1000,
        },
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxRequestsPerHour: 1000,
        },
      },
      cache: {
        enabled: true,
        maxSize: 1000,
        ttl: 60 * 60 * 1000,
        persistToDisk: false,
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

  isProviderConfigured(provider: string): boolean {
    const config = this.getAIConfig();
    switch (provider) {
      case 'ollama':
        return true; // Ollama is always available locally
      case 'openai':
        return !!config.openai?.apiKey;
      case 'claude':
        return !!config.claude?.apiKey;
      default:
        return false;
    }
  }

  getProviderConfig(provider: string): Record<string, unknown> | null {
    const config = this.getAIConfig();
    switch (provider) {
      case 'ollama':
        return config.ollama || null;
      case 'openai':
        return config.openai || null;
      case 'claude':
        return config.claude || null;
      default:
        return null;
    }
  }

  detectBestProvider(): string {
    const config = this.getAIConfig();

    // Check in order of preference
    if (config.provider === 'ollama') return 'ollama';
    if (this.isProviderConfigured('openai')) return 'openai';
    if (this.isProviderConfigured('claude')) return 'claude';

    return 'disabled';
  }

  isAIAvailable(): boolean {
    const provider = this.detectBestProvider();
    return provider !== 'disabled';
  }

  /**
   * Validate configuration object structure and values
   */
  private isValidConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object' || config === null) return false;

    const configObj = config as Record<string, unknown>;

    // Check for dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (this.hasDangerousKeys(configObj, dangerousKeys)) return false;

    // Validate AI config if present
    if (
      configObj.ai &&
      typeof configObj.ai === 'object' &&
      configObj.ai !== null
    ) {
      const aiConfig = configObj.ai as Record<string, unknown>;
      const { provider } = aiConfig;
      const validProviders = ['ollama', 'openai', 'claude', 'disabled'];
      if (provider && !validProviders.includes(String(provider))) return false;

      // Validate timeout values
      if (
        aiConfig.timeout &&
        (typeof aiConfig.timeout !== 'number' ||
          aiConfig.timeout < 0 ||
          aiConfig.timeout > 300000)
      ) {
        return false;
      }

      // Validate confidence threshold
      if (
        aiConfig.confidenceThreshold !== undefined &&
        (typeof aiConfig.confidenceThreshold !== 'number' ||
          aiConfig.confidenceThreshold < 0 ||
          aiConfig.confidenceThreshold > 3)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check for dangerous keys that could lead to prototype pollution
   */
  private hasDangerousKeys(
    obj: Record<string, unknown>,
    dangerousKeys: string[]
  ): boolean {
    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) return true;
      if (
        obj[key] &&
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        this.hasDangerousKeys(
          obj[key] as Record<string, unknown>,
          dangerousKeys
        )
      ) {
        return true;
      }
    }
    return false;
  }
}
