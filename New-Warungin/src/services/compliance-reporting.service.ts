/**
 * Compliance Reporting Service
 * Handles GDPR compliance, data export, data deletion
 */

import crypto from 'crypto';
import prisma from '../config/database';
import logger from '../utils/logger';
import dataEncryptionService from './data-encryption.service';

interface DataExportRequest {
  tenantId: string;
  userId?: string;
  format: 'JSON' | 'CSV';
  includePersonalData: boolean;
  includeTransactions: boolean;
  includeOrders: boolean;
}

interface DataDeletionRequest {
  tenantId: string;
  userId?: string;
  reason: string;
  deletePersonalData: boolean;
  anonymizeTransactions: boolean;
}

class ComplianceReportingService {
  /**
   * Export user data (GDPR Right to Data Portability)
   */
  async exportUserData(request: DataExportRequest): Promise<any> {
    try {
      const exportData: any = {
        exportedAt: new Date().toISOString(),
        tenantId: request.tenantId,
        userId: request.userId,
      };

      if (request.includePersonalData && request.userId) {
        // Export user personal data
        const user = await prisma.user.findFirst({
          where: {
            id: request.userId,
            tenantId: request.tenantId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
          },
        });
        exportData.user = user;
      }

      if (request.includeOrders) {
        // Export orders
        const orders = await prisma.order.findMany({
          where: {
            tenantId: request.tenantId,
            ...(request.userId && { userId: request.userId }),
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        });
        exportData.orders = orders;
      }

      if (request.includeTransactions) {
        // Export transactions
        const transactions = await prisma.transaction.findMany({
          where: {
            tenantId: request.tenantId,
            ...(request.userId && { userId: request.userId }),
          },
        });
        exportData.transactions = transactions;
      }

      // Format export based on requested format
      if (request.format === 'CSV') {
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error: any) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data (GDPR Right to be Forgotten)
   */
  async deleteUserData(request: DataDeletionRequest): Promise<{ deleted: boolean; anonymized: number }> {
    try {
      let anonymized = 0;

      if (request.userId) {
        if (request.deletePersonalData) {
          // Delete or anonymize user data
          await prisma.user.update({
            where: { id: request.userId },
            data: {
              name: 'DELETED_USER',
              email: `deleted_${Date.now()}@deleted.local`,
              password: crypto.randomBytes(32).toString('hex'), // Random password
              isActive: false,
            },
          });
        }

        if (request.anonymizeTransactions) {
          // Anonymize transactions
          const result = await prisma.transaction.updateMany({
            where: {
              tenantId: request.tenantId,
              userId: request.userId,
            },
            data: {
              userId: null, // Remove user reference
            },
          });
          anonymized += result.count;
        }

        // Log deletion
        await prisma.auditLog.create({
          data: {
            tenantId: request.tenantId,
            userId: request.userId,
            action: 'DATA_DELETION',
            resource: 'USER',
            resourceId: request.userId,
            metadata: JSON.stringify({
              reason: request.reason,
              deletePersonalData: request.deletePersonalData,
              anonymizeTransactions: request.anonymizeTransactions,
            }),
            severity: 'HIGH',
          },
        });
      }

      return {
        deleted: true,
        anonymized,
      };
    } catch (error: any) {
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Get data retention summary
   */
  async getDataRetentionSummary(tenantId: string): Promise<{
    userCount: number;
    orderCount: number;
    transactionCount: number;
    oldestData: Date | null;
    retentionPolicy: string;
  }> {
    try {
      const [userCount, orderCount, transactionCount, oldestOrder] = await Promise.all([
        prisma.user.count({ where: { tenantId } }),
        prisma.order.count({ where: { tenantId } }),
        prisma.transaction.count({ where: { tenantId } }),
        prisma.order.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

      return {
        userCount,
        orderCount,
        transactionCount,
        oldestData: oldestOrder?.createdAt || null,
        retentionPolicy: '7 years (as per Indonesian tax law)',
      };
    } catch (error: any) {
      logger.error('Error getting data retention summary:', error);
      throw error;
    }
  }

  /**
   * Convert export data to CSV
   */
  private convertToCSV(data: any): string {
    // Simple CSV conversion
    const lines: string[] = [];
    
    if (data.user) {
      lines.push('User Data');
      lines.push(Object.keys(data.user).join(','));
      lines.push(Object.values(data.user).join(','));
      lines.push('');
    }

    if (data.orders && data.orders.length > 0) {
      lines.push('Orders');
      lines.push('ID,Order Number,Total,Status,Created At');
      data.orders.forEach((order: any) => {
        lines.push(`${order.id},${order.orderNumber},${order.total},${order.status},${order.createdAt}`);
      });
      lines.push('');
    }

    if (data.transactions && data.transactions.length > 0) {
      lines.push('Transactions');
      lines.push('ID,Amount,Status,Created At');
      data.transactions.forEach((tx: any) => {
        lines.push(`${tx.id},${tx.amount},${tx.status},${tx.createdAt}`);
      });
    }

    return lines.join('\n');
  }
}

export default new ComplianceReportingService();

