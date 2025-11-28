/**
 * GDPR Compliance Service
 * Handles data export, right to be forgotten, and data portability
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import { createHash } from 'crypto';

export interface UserDataExport {
  user: any;
  orders: any[];
  transactions: any[];
  customers: any[];
  members: any[];
  products: any[];
  exportDate: string;
  format: 'json' | 'csv';
}

export class GDPRService {
  /**
   * Export all user data (GDPR Right to Data Portability)
   */
  async exportUserData(userId: string, tenantId: string): Promise<UserDataExport> {
    try {
      // Get user data
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get all user-related data
      const [orders, transactions, customers, members, products] = await Promise.all([
        // Orders created by user
        prisma.order.findMany({
          where: { tenantId, userId },
          include: {
            items: true,
            customer: true,
            member: true,
          },
        }),

        // Transactions
        prisma.transaction.findMany({
          where: { tenantId },
          include: {
            order: true,
          },
        }),

        // Customers
        prisma.customer.findMany({
          where: { tenantId },
        }),

        // Members
        prisma.member.findMany({
          where: { tenantId },
        }),

        // Products
        prisma.product.findMany({
          where: { tenantId },
        }),
      ]);

      return {
        user,
        orders,
        transactions,
        customers,
        members,
        products,
        exportDate: new Date().toISOString(),
        format: 'json',
      };
    } catch (error: any) {
      logger.error('Error exporting user data', { error: error.message, userId, tenantId });
      throw error;
    }
  }

  /**
   * Delete user data (GDPR Right to be Forgotten)
   * Anonymizes data instead of hard delete for audit purposes
   */
  async deleteUserData(userId: string, tenantId: string): Promise<void> {
    try {
      // Anonymize user data
      const hashedEmail = createHash('sha256').update(userId).digest('hex');
      const anonymizedName = `Deleted User ${hashedEmail.substring(0, 8)}`;

      await prisma.user.update({
        where: { id: userId },
        data: {
          name: anonymizedName,
          email: `deleted_${hashedEmail}@deleted.local`,
          password: createHash('sha256').update(`deleted_${Date.now()}`).digest('hex'),
          isActive: false,
          // Clear sensitive data
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          passwordHistory: null,
        },
      });

      // Anonymize orders created by user
      await prisma.order.updateMany({
        where: { userId, tenantId },
        data: {
          notes: '[Data deleted per GDPR request]',
        },
      });

      logger.info('User data anonymized per GDPR request', { userId, tenantId });
    } catch (error: any) {
      logger.error('Error deleting user data', { error: error.message, userId, tenantId });
      throw error;
    }
  }

  /**
   * Export tenant data (for tenant admin)
   */
  async exportTenantData(tenantId: string): Promise<any> {
    try {
      const [
        tenant,
        users,
        products,
        orders,
        transactions,
        customers,
        members,
        subscriptions,
      ] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.user.findMany({ where: { tenantId } }),
        prisma.product.findMany({ where: { tenantId } }),
        prisma.order.findMany({
          where: { tenantId },
          include: { items: true, customer: true, member: true },
        }),
        prisma.transaction.findMany({
          where: { tenantId },
          include: { order: true },
        }),
        prisma.customer.findMany({ where: { tenantId } }),
        prisma.member.findMany({ where: { tenantId } }),
        prisma.subscription.findMany({
          where: { tenantId },
          include: { history: true },
        }),
      ]);

      return {
        tenant,
        users,
        products,
        orders,
        transactions,
        customers,
        members,
        subscriptions,
        exportDate: new Date().toISOString(),
        format: 'json',
      };
    } catch (error: any) {
      logger.error('Error exporting tenant data', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Generate data export file (JSON or CSV)
   */
  async generateExportFile(data: any, format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format (simplified - would need proper CSV library for complex data)
    // For now, return JSON as CSV is complex for nested data
    return JSON.stringify(data, null, 2);
  }
}

export default new GDPRService();

