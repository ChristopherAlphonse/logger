import type { AIInsight, IAICache } from './types';
import CryptoJS from 'crypto-js';

function createHash(algorithm: string) {
  if (algorithm !== 'md5') {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  return {
    update(data: string) {
      return {
        digest(encoding: string) {
          if (encoding !== 'hex') {
            throw new Error(`Unsupported encoding: ${encoding}`);
          }
          return CryptoJS.MD5(data).toString();
        },
      };
    },
  };
}

interface CacheEntry {
  insight: AIInsight;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
  totalRequests: number;
}

export class AICache implements IAICache {
  private cache = new Map<string, CacheEntry>();
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    evictions: 0,
    totalRequests: 0,
  };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  async get(key: string): Promise<AIInsight | null> {
    this.cacheStats.totalRequests++;
    const entry = this.cache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.cacheStats.size--;
      return null;
    }

    entry.timestamp = Date.now();
    this.cacheStats.hits++;
    return entry.insight;
  }

  async set(key: string, insight: AIInsight, ttl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      insight,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
    this.cacheStats.size = this.cache.size;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.cacheStats.size = 0;
  }

  async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: this.cacheStats.size,
    };
  }

  getDetailedStats(): CacheStats & { hitRate: number } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? this.cacheStats.hits / total : 0;

    return {
      ...this.cacheStats,
      hitRate,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheStats.evictions++;
      this.cacheStats.size--;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        this.cacheStats.size--;
      }
    }
  }

  static generateErrorKey(
    error: Error,
    context?: Record<string, unknown>
  ): string {
    const data = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
    };
    return createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  static generateStackTraceKey(
    stackFrames: Array<{
      functionName?: string;
      fileName?: string;
      lineNumber?: number;
    }>,
    context?: Record<string, unknown>
  ): string {
    const data = {
      frames: stackFrames,
      context,
    };
    return createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  static generateCustomKey(data: string): string {
    return createHash('md5').update(data).digest('hex');
  }

  async preloadCommonPatterns(): Promise<void> {
    const commonErrors = [
      'TypeError: Cannot read property',
      'ReferenceError: Cannot access',
      'SyntaxError: Unexpected token',
      'RangeError: Maximum call stack size exceeded',
      'URIError: URI malformed',
    ];

    for (const errorPattern of commonErrors) {
      const key = this.generateCommonErrorKey('TypeError', errorPattern);
      const mockInsight: AIInsight = {
        explanation: `Common ${errorPattern} error`,
        likelyCauses: ['Undefined variable', 'Missing property'],
        suggestedFix: 'Check variable initialization',
        contextualInsights: ['Ensure proper variable scope'],
        confidence: 2,
        processingTime: 0,
        cached: true,
      };
      await this.set(key, mockInsight, 24 * 60 * 60 * 1000);
    }
  }

  private generateCommonErrorKey(
    errorType: string,
    messagePattern: string
  ): string {
    return createHash('md5')
      .update(`${errorType}:${messagePattern}`)
      .digest('hex');
  }

  getEfficiencyMetrics(): {
    hitRate: number;
    averageHitsPerEntry: number;
    cacheUtilization: number;
    evictionRate: number;
  } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? this.cacheStats.hits / total : 0;
    const averageHitsPerEntry =
      this.cacheStats.size > 0
        ? this.cacheStats.hits / this.cacheStats.size
        : 0;
    const cacheUtilization = this.cacheStats.size / this.maxSize;
    const evictionRate =
      this.cacheStats.totalRequests > 0
        ? this.cacheStats.evictions / this.cacheStats.totalRequests
        : 0;

    return {
      hitRate,
      averageHitsPerEntry,
      cacheUtilization,
      evictionRate,
    };
  }

  optimize(): void {
    this.cleanup();

    if (this.cacheStats.size < this.maxSize * 0.3) {
      this.maxSize = Math.max(100, Math.floor(this.maxSize * 0.8));
    }

    const evictionRate =
      this.cacheStats.evictions / Math.max(1, this.cacheStats.totalRequests);
    if (evictionRate > 0.1) {
      this.maxSize = Math.min(10000, Math.floor(this.maxSize * 1.2));
    }
  }
}
