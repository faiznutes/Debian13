import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';

const redisClient = getRedisClient();

// Only create queue if Redis is actually available
// Don't create queue if Redis client is null (will fail silently)
export const emailQueue = redisClient
  ? new Queue('email', {
      connection: redisClient,
    })
  : null;

export const addEmailJob = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  if (!emailQueue) {
    console.warn('Email queue not available (Redis not configured)');
    return;
  }
  await emailQueue.add('send-email', {
    to,
    subject,
    html,
  });
};

