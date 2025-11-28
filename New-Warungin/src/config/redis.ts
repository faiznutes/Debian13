import { Redis } from 'ioredis';
import env from './env';
import logger from '../utils/logger';

let redisClient: Redis | null = null;
let redisFailed = false; // Track if Redis connection has failed

export const getRedisClient = (): Redis | null => {
  // Redis is optional - return null if not configured
  // Check if Redis is explicitly disabled or not configured
  // If REDIS_URL is not set and REDIS_HOST is empty, don't try to connect
  if (!env.REDIS_URL && (!env.REDIS_HOST || env.REDIS_HOST.trim() === '')) {
    return null;
  }

  // If Redis connection has already failed, don't try again
  if (redisFailed) {
    return null;
  }

  if (!redisClient) {
    try {
      const redisConfig = env.REDIS_URL 
        ? env.REDIS_URL 
        : {
            host: env.REDIS_HOST || 'localhost',
            port: env.REDIS_PORT || 6379,
            password: env.REDIS_PASSWORD || undefined,
          };
      
      redisClient = new Redis(
        redisConfig as any,
        {
          retryStrategy: (times) => {
            // Stop retrying after 3 attempts
            if (times > 3) {
              logger.info('ℹ️  Redis connection failed after 3 attempts - disabling Redis');
              redisFailed = true;
              redisClient = null;
              return null; // Stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: null, // Required for BullMQ
          lazyConnect: true,
          enableOfflineQueue: false, // Disable offline queue to fail fast
          connectTimeout: 2000, // 2 second timeout
          showFriendlyErrorStack: false, // Don't show full error stack
        }
      );

      redisClient.on('error', (err) => {
        // Only log if it's not a connection refused (which is expected if Redis is not running)
        if (!err.message.includes('ECONNREFUSED') && !err.message.includes('connect')) {
          logger.warn('Redis error (optional service):', err.message);
        }
        // Mark as failed and set to null
        if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
          logger.info('ℹ️  Redis not available - scheduled jobs disabled (this is normal if Redis is not installed)');
          redisFailed = true;
          redisClient = null;
        }
      });

      redisClient.on('connect', () => {
        logger.info('✅ Redis connected');
      });

      redisClient.on('ready', () => {
        logger.info('✅ Redis ready');
      });
    } catch (error) {
      logger.info('ℹ️  Redis not available - scheduled jobs disabled');
      redisClient = null;
      return null;
    }
  }

  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
    } catch (error) {
      logger.warn('Redis close error:', error);
    }
  }
};

