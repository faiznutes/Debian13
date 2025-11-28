import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';
// Email system disabled - using n8n instead
// import { emailQueue } from '../queues/email.queue';
import { backupQueue } from '../queues/backup.queue';
import { notificationQueue } from '../queues/notification.queue';
import { getSubscriptionQueue } from '../queues/subscription.queue';
// import { processEmailJob } from '../jobs/email.job';
import { processBackupJob } from '../jobs/backup.job';
import { processNotificationJob } from '../queues/notification.queue';
import { processSubscriptionRevertJob } from '../jobs/subscription-revert.job';

// Initialize workers lazily to avoid blocking app start
let redisClient: ReturnType<typeof getRedisClient> = null;
// Email worker disabled - using n8n instead
let backupWorker: Worker | null = null;
let notificationWorker: Worker | null = null;
let subscriptionWorker: Worker | null = null;
let workersInitialized = false;

// Initialize workers only when needed (lazy initialization)
const initializeWorkers = (): void => {
  if (workersInitialized) return;

  try {
    redisClient = getRedisClient();

    if (!redisClient) {
      logger.info('ℹ️  Redis not configured - scheduled jobs disabled');
      workersInitialized = true;
      return;
    }

    // Wait a bit for Redis connection, but don't block
    // If Redis is not available, workers will fail gracefully
    setTimeout(() => {
      try {
        // Check if Redis is actually connected before creating workers
        if (redisClient && redisClient.status === 'ready') {
          // Email worker disabled - using n8n instead
          // emailWorker = new Worker('email', async (job) => {
          //   await processEmailJob(job);
          // }, {
          //   connection: redisClient!,
          // });

          // Backup worker - can be disabled if using n8n
          // Keeping for now as fallback, but n8n should handle this
          backupWorker = new Worker('backup', async (job) => {
            await processBackupJob(job);
          }, {
            connection: redisClient!,
          });

          notificationWorker = new Worker('notification', async (job) => {
            await processNotificationJob(job);
          }, {
            connection: redisClient!,
          });

          subscriptionWorker = new Worker('subscription', async (job) => {
            await processSubscriptionRevertJob(job);
          }, {
            connection: redisClient!,
          });

          logger.info('✅ BullMQ workers created');
        } else {
          logger.warn('⚠️  Redis not ready - workers not created');
          logger.warn('⚠️  Scheduled jobs will be disabled');
        }
      } catch (error: any) {
        logger.warn('⚠️  Failed to create BullMQ workers:', error?.message || error);
        logger.warn('⚠️  Scheduled jobs will be disabled');
        // emailWorker = null; // Disabled
        backupWorker = null;
        notificationWorker = null;
        subscriptionWorker = null;
      }
      workersInitialized = true;
    }, 2000); // Wait 2 seconds for Redis connection
  } catch (error: any) {
    logger.warn('⚠️  Redis initialization error:', error?.message || error);
    logger.warn('⚠️  Scheduled jobs will be disabled');
    workersInitialized = true;
  }
};

// Schedule jobs
export const scheduleJobs = async (): Promise<void> => {
  if (!redisClient) {
    logger.warn('⚠️  Redis not available - scheduled jobs disabled');
    return;
  }

  const subscriptionQueue = getSubscriptionQueue();

  try {
    // Daily backup job (runs at 2 AM)
    if (backupQueue) {
      await backupQueue.add(
        'daily-backup',
        {
          type: 'incremental',
        },
        {
          repeat: {
            pattern: '0 2 * * *', // 2 AM daily
          },
        }
      );
    }

    // Subscription revert job
    // In production: daily at 3 AM
    if (subscriptionQueue) {
      const pattern = '0 3 * * *'; // 3 AM daily for production
      
      await subscriptionQueue.add(
        'revert-temporary-upgrades',
        {},
        {
          repeat: {
            pattern: pattern,
          },
        }
      );
      
      logger.info(`✅ Subscription revert job scheduled: ${pattern}`);
    }

    logger.info('✅ Scheduled jobs initialized');
  } catch (error) {
    logger.warn('⚠️  Failed to initialize scheduled jobs:', error);
  }
};

// Process scheduled emails (runs every minute)
// This can be called directly or integrated with a cron library
let scheduledEmailInterval: NodeJS.Timeout | null = null;

export const startScheduledEmailProcessor = (): void => {
  // Only start if not already running
  if (scheduledEmailInterval) {
    return;
  }

  // Import email scheduler service
  import('../services/email-scheduler.service').then(({ default: emailSchedulerService }) => {
    // Process scheduled emails every minute
    scheduledEmailInterval = setInterval(async () => {
      try {
        const results = await emailSchedulerService.processScheduledEmails();
        if (results.processed > 0) {
          logger.info(`✅ Processed ${results.processed} scheduled emails: ${results.sent} sent, ${results.failed} failed`);
        }
      } catch (error: any) {
        logger.error('❌ Error processing scheduled emails:', error);
      }
    }, 60000); // Every minute (60000 ms)

    logger.info('✅ Scheduled email processor started (runs every minute)');
  }).catch((error) => {
    logger.warn('⚠️  Failed to start scheduled email processor:', error);
  });
};

export const stopScheduledEmailProcessor = (): void => {
  if (scheduledEmailInterval) {
    clearInterval(scheduledEmailInterval);
    scheduledEmailInterval = null;
    logger.info('✅ Scheduled email processor stopped');
  }
};

// Start scheduler (only after workers are initialized)
if (process.env.NODE_ENV !== 'test') {
  // Initialize workers asynchronously
  initializeWorkers();
  
  // Try to schedule jobs after a delay
  setTimeout(() => {
    if (redisClient) {
      scheduleJobs().catch((error) => {
        logger.error('Failed to start scheduler:', error);
      });
    }
  }, 2000);

  // Start scheduled email processor
  setTimeout(() => {
    startScheduledEmailProcessor();
  }, 3000); // Start after workers are initialized
}

// Email queue disabled - using n8n instead
// export { emailQueue, backupQueue, notificationQueue };
export { backupQueue, notificationQueue };

