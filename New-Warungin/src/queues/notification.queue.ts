import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { emitToTenant } from '../socket/socket';

const redisClient = getRedisClient();

// Only create queue if Redis is actually available
// Don't create queue if Redis client is null (will fail silently)
export const notificationQueue = redisClient
  ? new Queue('notification', {
      connection: redisClient,
    })
  : null;

export interface NotificationData {
  tenantId: string;
  userId?: string;
  type: string;
  message: string;
  data?: any;
}

export const addNotificationJob = async (
  data: NotificationData
): Promise<void> => {
  if (!notificationQueue) {
    // Fallback: send directly via Socket.IO
    emitToTenant(data.tenantId, 'notification', {
      type: data.type,
      message: data.message,
      data: data.data,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  await notificationQueue.add('send-notification', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Process notification job
export const processNotificationJob = async (job: any): Promise<void> => {
  const { tenantId, type, message, data } = job.data;

  // Emit via Socket.IO
  emitToTenant(tenantId, 'notification', {
    type,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

