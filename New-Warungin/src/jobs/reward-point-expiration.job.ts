import rewardPointService from '../services/reward-point.service';
import prisma from '../config/database';

/**
 * Background job untuk auto-expire reward points
 * Run setiap hari untuk expire points yang sudah kadaluarsa
 */
export async function expireRewardPointsJob() {
  console.log('[Reward Points Job] Starting expiration check...');

  try {
    // Get all reward points
    const allRewardPoints = await prisma.rewardPoint.findMany({
      select: {
        id: true,
        tenantId: true,
        userId: true,
      },
    });

    let totalExpired = 0;
    let processedCount = 0;

    for (const rewardPoint of allRewardPoints) {
      try {
        const expiredPoints = await rewardPointService.checkAndExpirePoints(
          rewardPoint.tenantId,
          rewardPoint.userId || undefined
        );

        if (expiredPoints > 0) {
          totalExpired += expiredPoints;
          console.log(
            `[Reward Points Job] Expired ${expiredPoints} points for tenant ${rewardPoint.tenantId}, user ${rewardPoint.userId || 'N/A'}`
          );
        }

        processedCount++;
      } catch (error: any) {
        console.error(
          `[Reward Points Job] Error processing reward point ${rewardPoint.id}:`,
          error.message
        );
      }
    }

    console.log(
      `[Reward Points Job] Completed. Processed ${processedCount} reward points, expired ${totalExpired} total points.`
    );

    return {
      success: true,
      processedCount,
      totalExpired,
    };
  } catch (error: any) {
    console.error('[Reward Points Job] Fatal error:', error);
    throw error;
  }
}

/**
 * Schedule job menggunakan node-cron atau similar
 * Example: Run setiap hari jam 00:00
 */
export function scheduleRewardPointExpiration() {
  // Jika menggunakan node-cron:
  // import cron from 'node-cron';
  // cron.schedule('0 0 * * *', expireRewardPointsJob); // Every day at midnight

  // Atau bisa diintegrasikan dengan scheduler lain
  console.log('[Reward Points Job] Scheduled to run daily at midnight');
}

