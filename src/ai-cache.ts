import { createHash } from 'crypto';
import type { AIInsight, IAICache } from './types';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  insight: AIInsight;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
  totalRequests: number;
}

/**
 * In-memory cache for AI insights with TTL and LRU eviction
 */
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
    // 1 hour default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Periodically clean up expired entries
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get an insight from cache
   */
  async get(key: string): Promise<AIInsight | null> {
    this.cacheStats.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.cacheStats.size--;
      return null;
    }

    // Update access metadata
    entry.hits++;
    entry.lastAccessed = Date.now();

    // Mark insight as cached
    const cachedInsight = { ...entry.insight, cached: true };

    this.cacheStats.hits++;
    return cachedInsight;
  }

  /**
   * Set an insight in cache
   */
  async set(key: string, insight: AIInsight, ttl?: number): Promise<void> {
    const effectiveTTL = ttl || this.defaultTTL;
    const now = Date.now();

    // If cache is at max size, evict least recently used entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      insight: { ...insight, cached: false }, // Store original cached state
      timestamp: now,
      ttl: effectiveTTL,
      hits: 0,
      lastAccessed: now,
    };

    const wasExisting = this.cache.has(key);
    this.cache.set(key, entry);

    if (!wasExisting) {
      this.cacheStats.size++;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.cacheStats.size = 0;
    this.cacheStats.evictions = 0;
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: this.cacheStats.size,
    };
  }

  /**
   * Get detailed statistics including hit rate and evictions
   */
  getDetailedStats(): CacheStats & { hitRate: number } {
    const hitRate =
      this.cacheStats.totalRequests > 0
        ? this.cacheStats.hits / this.cacheStats.totalRequests
        : 0;

    return {
      ...this.cacheStats,
      hitRate,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheStats.size--;
      this.cacheStats.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.cacheStats.size--;
    }
  }

  /**
   * Generate a cache key for an error
   */
  static generateErrorKey(
    error: Error,
    context?: Record<string, unknown>
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const data = `${error.name}:${error.message}:${
      error.stack?.substring(0, 200) || ''
    }:${contextStr}`;
    return createHash('md5').update(data).digest('hex');
  }

  /**
   * Generate a cache key for a stack trace
   */
  static generateStackTraceKey(
    stackFrames: Array<{
      functionName?: string;
      fileName?: string;
      lineNumber?: number;
    }>,
    context?: Record<string, unknown>
  ): string {
    const stackStr = stackFrames
      .slice(0, 5) // Only use top 5 frames for key
      .map(
        frame =>
          `${frame.functionName || 'anonymous'}:${
            frame.fileName || 'unknown'
          }:${frame.lineNumber || 0}`
      )
      .join('|');

    const contextStr = context ? JSON.stringify(context) : '';
    const data = `stack:${stackStr}:${contextStr}`;
    return createHash('md5').update(data).digest('hex');
  }

  /**
   * Generate a cache key for a custom analysis
   */
  static generateCustomKey(data: string): string {
    return createHash('md5').update(data).digest('hex');
  }

  /**
   * Preload common error patterns
   */
  async preloadCommonPatterns(): Promise<void> {
    const commonPatterns = [
      {
        key: this.generateCommonErrorKey('TypeError', 'Cannot read property'),
        insight: {
          explanation:
            "You're trying to access a property on null or undefined.",
          likelyCauses: [
            'Variable not initialized',
            'Async operation not completed',
            'API returned null/undefined',
          ],
          suggestedFix: 'Use optional chaining (?.) or null checks',
          contextualInsights: [
            'This is one of the most common JavaScript errors',
            'Consider using TypeScript for better type safety',
          ],
          confidence: 2, // HIGH
          processingTime: 0,
          cached: true,
        } as AIInsight,
      },
      {
        key: this.generateCommonErrorKey('ReferenceError', 'is not defined'),
        insight: {
          explanation:
            "You're trying to use a variable that hasn't been declared.",
          likelyCauses: [
            'Typo in variable name',
            'Missing import statement',
            'Variable out of scope',
          ],
          suggestedFix: 'Check spelling and ensure proper imports',
          contextualInsights: [
            'Common in module systems',
            'Check your import/export statements',
          ],
          confidence: 2, // HIGH
          processingTime: 0,
          cached: true,
        } as AIInsight,
      },
    ];

    for (const pattern of commonPatterns) {
      await this.set(pattern.key, pattern.insight, this.defaultTTL * 24); // Cache for 24 hours
    }
  }

  /**
   * Generate key for common error patterns
   */
  private generateCommonErrorKey(
    errorType: string,
    messagePattern: string
  ): string {
    return createHash('md5')
      .update(`common:${errorType}:${messagePattern}`)
      .digest('hex');
  }

  /**
   * Get cache efficiency metrics
   */
  getEfficiencyMetrics(): {
    hitRate: number;
    averageHitsPerEntry: number;
    cacheUtilization: number;
    evictionRate: number;
  } {
    const hitRate =
      this.cacheStats.totalRequests > 0
        ? this.cacheStats.hits / this.cacheStats.totalRequests
        : 0;

    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    const averageHitsPerEntry =
      this.cache.size > 0 ? totalHits / this.cache.size : 0;

    const cacheUtilization = this.cache.size / this.maxSize;

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

  /**
   * Optimize cache by removing low-value entries
   */
  optimize(): void {
    if (this.cache.size <= this.maxSize * 0.8) {
      return; // Cache not full enough to optimize
    }

    const entries = Array.from(this.cache.entries());

    // Sort by value score (hits / age)
    entries.sort(([, a], [, b]) => {
      const ageA = Date.now() - a.timestamp;
      const ageB = Date.now() - b.timestamp;
      const scoreA = a.hits / (ageA / (1000 * 60 * 60)); // hits per hour
      const scoreB = b.hits / (ageB / (1000 * 60 * 60)); // hits per hour
      return scoreB - scoreA;
    });

    // Remove bottom 20% of entries
    const removeCount = Math.floor(this.cache.size * 0.2);
    for (let i = entries.length - removeCount; i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.cacheStats.size--;
      this.cacheStats.evictions++;
    }
  }
}
