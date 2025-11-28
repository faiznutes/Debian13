import { Job } from 'bullmq';
import logger from '../utils/logger';
import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupJobData {
  tenantId?: string;
  type: 'full' | 'incremental';
}

export const processBackupJob = async (job: Job<BackupJobData>): Promise<void> => {
  const { tenantId, type } = job.data;

  logger.info(`Processing backup job: ${type} for tenant ${tenantId || 'all'}`);

  try {
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = tenantId 
      ? `backup-${tenantId}-${type}-${timestamp}.json`
      : `backup-all-${type}-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    // For full backup, export all tenant data
    if (type === 'full') {
      if (tenantId) {
        // Backup specific tenant
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            users: true,
            products: true,
            orders: {
              include: {
                items: true,
              },
            },
            customers: true,
            members: true,
            transactions: true,
          },
        });

        if (tenant) {
          fs.writeFileSync(backupPath, JSON.stringify(tenant, null, 2));
          logger.info(`✅ Full backup completed for tenant ${tenantId}: ${backupPath}`);
        } else {
          throw new Error(`Tenant ${tenantId} not found`);
        }
      } else {
        // Backup all tenants (summary only to avoid large files)
        const tenants = await prisma.tenant.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionPlan: true,
            subscriptionEnd: true,
            createdAt: true,
          },
        });

        const backupData = {
          timestamp: new Date().toISOString(),
          type: 'full',
          tenants: tenants,
          summary: {
            totalTenants: tenants.length,
            activeTenants: tenants.filter(t => t.subscriptionEnd && new Date(t.subscriptionEnd) > new Date()).length,
          },
        };

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        logger.info(`✅ Full backup completed for all tenants: ${backupPath}`);
      }
    } else {
      // Incremental backup - only recent changes
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      if (tenantId) {
        // Incremental backup for specific tenant
        const recentOrders = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: { gte: oneDayAgo },
          },
          include: {
            items: true,
          },
        });

        const recentTransactions = await prisma.transaction.findMany({
          where: {
            tenantId,
            createdAt: { gte: oneDayAgo },
          },
        });

        const backupData = {
          timestamp: new Date().toISOString(),
          type: 'incremental',
          tenantId,
          period: {
            from: oneDayAgo.toISOString(),
            to: new Date().toISOString(),
          },
          orders: recentOrders,
          transactions: recentTransactions,
        };

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        logger.info(`✅ Incremental backup completed for tenant ${tenantId}: ${backupPath}`);
      } else {
        // Incremental backup for all tenants
        const recentOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: oneDayAgo },
          },
          include: {
            items: true,
          },
          take: 1000, // Limit to avoid large files
        });

        const backupData = {
          timestamp: new Date().toISOString(),
          type: 'incremental',
          period: {
            from: oneDayAgo.toISOString(),
            to: new Date().toISOString(),
          },
          orders: recentOrders,
          summary: {
            totalOrders: recentOrders.length,
          },
        };

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        logger.info(`✅ Incremental backup completed for all tenants: ${backupPath}`);
      }
    }

    // Cleanup old backups (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️  Deleted old backup: ${file}`);
      }
    }

    logger.info(`✅ Backup completed: ${type} for tenant ${tenantId || 'all'}`);
  } catch (error: any) {
    logger.error(`❌ Backup failed:`, error);
    throw error;
  }
};
