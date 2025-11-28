import { getRedisClient } from '../config/redis';
import logger from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  prefix?: string; // Cache key prefix
}

/**
 * Cache utility for consistent caching across services
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      logger.warn(`Failed to read from cache (key: ${key}):`, error);
    }

    return null;
  }

  /**
   * Set value in cache
   */
  static async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
      return false;
    }

    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn(`Failed to write to cache (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
      return false;
    }

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.warn(`Failed to delete from cache (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  static async deletePattern(pattern: string): Promise<number> {
    const redis = getRedisClient();
    if (!redis) {
      return 0;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.warn(`Failed to delete cache pattern (pattern: ${pattern}):`, error);
      return 0;
    }
  }

  /**
   * Get or set value with caching
   * If cache miss, execute the function and cache the result
   */
  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 300, prefix = '' } = options;
    const fullKey = prefix ? `${prefix}:${key}` : key;

    // Try to get from cache
    const cached = await this.get<T>(fullKey);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function and cache result
    const result = await fn();
    await this.set(fullKey, result, ttl);
    return result;
  }

  /**
   * Invalidate cache for a tenant (useful when tenant data changes)
   */
  static async invalidateTenant(tenantId: string, patterns: string[] = []): Promise<void> {
    const defaultPatterns = [
      `products:${tenantId}:*`,
      `product:${tenantId}:*`,
      `orders:${tenantId}:*`,
      `order:${tenantId}:*`,
      `customers:${tenantId}:*`,
      `customer:${tenantId}:*`,
      `dashboard:${tenantId}:*`,
      `analytics:${tenantId}:*`,
    ];

    const allPatterns = [...defaultPatterns, ...patterns];
    
    for (const pattern of allPatterns) {
      await this.deletePattern(pattern);
    }
  }
}

export default CacheService;

