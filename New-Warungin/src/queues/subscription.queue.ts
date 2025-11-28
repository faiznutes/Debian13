import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

let subscriptionQueue: Queue | null = null;

export const getSubscriptionQueue = (): Queue | null => {
  if (subscriptionQueue) {
    return subscriptionQueue;
  }

  try {
    const redisClient = getRedisClient();
    if (!redisClient) {
      logger.warn('⚠️  Redis not configured - subscription queue disabled');
      return null;
    }

    subscriptionQueue = new Queue('subscription', {
      connection: redisClient,
    });

    logger.info('✅ Subscription queue created');
    return subscriptionQueue;
  } catch (error: any) {
    logger.warn('⚠️  Failed to create subscription queue:', error?.message || error);
    return null;
  }
};

export { subscriptionQueue };

