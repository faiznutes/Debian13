import { Job } from 'bullmq';
import subscriptionService from '../services/subscription.service';
import logger from '../utils/logger';

/**
 * Process subscription revert job
 */
export async function processSubscriptionRevertJob(job: Job) {
  try {
    logger.info('🔄 Processing subscription revert job...', { jobId: job.id });
    
    const result = await subscriptionService.revertTemporaryUpgrades();
    
    logger.info(`✅ Temporary subscription revert completed: ${result.reverted} reverted, ${result.failed} failed`);
    
    if (result.results.length > 0) {
      logger.info('Revert results:', result.results);
    }
    
    return result;
  } catch (error: any) {
    logger.error('❌ Error in subscription revert job:', error);
    throw error;
  }
}

/**
 * Job to revert temporary subscription upgrades that have expired
 * Should be run daily via cron
 */
export async function revertTemporaryUpgradesJob() {
  return processSubscriptionRevertJob({ id: 'manual', data: {} } as Job);
}

