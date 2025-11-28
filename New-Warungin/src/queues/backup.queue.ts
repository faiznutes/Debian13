import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';

const redisClient = getRedisClient();

// Only create queue if Redis is actually available
// Don't create queue if Redis client is null (will fail silently)
export const backupQueue = redisClient
  ? new Queue('backup', {
      connection: redisClient,
    })
  : null;

export const addBackupJob = async (
  tenantId: string | undefined,
  type: 'full' | 'incremental' = 'incremental'
): Promise<void> => {
  if (!backupQueue) {
    console.warn('Backup queue not available (Redis not configured)');
    return;
  }
  await backupQueue.add('database-backup', {
    tenantId,
    type,
  });
};

