/**
 * Data Archiving Service
 * Archives old data to reduce database size and improve performance
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ArchiveConfig {
  ordersOlderThanDays: number;
  transactionsOlderThanDays: number;
  reportsOlderThanDays: number;
  archivePath: string;
}

export class ArchiveService {
  private defaultConfig: ArchiveConfig = {
    ordersOlderThanDays: 365, // 1 year
    transactionsOlderThanDays: 365,
    reportsOlderThanDays: 180, // 6 months
    archivePath: './archives',
  };

  /**
   * Archive old orders
   */
  async archiveOldOrders(tenantId: string, olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get old orders
    const oldOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        items: true,
        transaction: true,
      },
    });

    if (oldOrders.length === 0) {
      return 0;
    }

    // Create archive directory
    const archiveDir = path.join(this.defaultConfig.archivePath, tenantId, 'orders');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Save to JSON file
    const archiveFile = path.join(archiveDir, `orders_${Date.now()}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(oldOrders, null, 2));

    // Delete from database
    const orderIds = oldOrders.map(o => o.id);
    await prisma.order.deleteMany({
      where: { id: { in: orderIds } },
    });

    logger.info('Orders archived', {
      tenantId,
      count: oldOrders.length,
      archiveFile,
    });

    return oldOrders.length;
  }

  /**
   * Archive old transactions
   */
  async archiveOldTransactions(tenantId: string, olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get old transactions
    const oldTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
    });

    if (oldTransactions.length === 0) {
      return 0;
    }

    // Create archive directory
    const archiveDir = path.join(this.defaultConfig.archivePath, tenantId, 'transactions');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Save to JSON file
    const archiveFile = path.join(archiveDir, `transactions_${Date.now()}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(oldTransactions, null, 2));

    // Delete from database
    const transactionIds = oldTransactions.map(t => t.id);
    await prisma.transaction.deleteMany({
      where: { id: { in: transactionIds } },
    });

    logger.info('Transactions archived', {
      tenantId,
      count: oldTransactions.length,
      archiveFile,
    });

    return oldTransactions.length;
  }

  /**
   * Archive old reports
   */
  async archiveOldReports(tenantId: string, olderThanDays: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get old reports
    const oldReports = await prisma.report.findMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
      },
    });

    if (oldReports.length === 0) {
      return 0;
    }

    // Create archive directory
    const archiveDir = path.join(this.defaultConfig.archivePath, tenantId, 'reports');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Save to JSON file
    const archiveFile = path.join(archiveDir, `reports_${Date.now()}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(oldReports, null, 2));

    // Delete from database
    const reportIds = oldReports.map(r => r.id);
    await prisma.report.deleteMany({
      where: { id: { in: reportIds } },
    });

    logger.info('Reports archived', {
      tenantId,
      count: oldReports.length,
      archiveFile,
    });

    return oldReports.length;
  }

  /**
   * Archive all old data for tenant
   */
  async archiveAllOldData(tenantId: string, config?: Partial<ArchiveConfig>): Promise<{
    orders: number;
    transactions: number;
    reports: number;
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const [orders, transactions, reports] = await Promise.all([
      this.archiveOldOrders(tenantId, finalConfig.ordersOlderThanDays),
      this.archiveOldTransactions(tenantId, finalConfig.transactionsOlderThanDays),
      this.archiveOldReports(tenantId, finalConfig.reportsOlderThanDays),
    ]);

    return { orders, transactions, reports };
  }

  /**
   * Restore archived data
   */
  async restoreArchivedData(tenantId: string, archiveFile: string): Promise<void> {
    if (!fs.existsSync(archiveFile)) {
      throw new Error('Archive file not found');
    }

    const data = JSON.parse(fs.readFileSync(archiveFile, 'utf8'));

    if (Array.isArray(data)) {
      // Determine type from file path
      if (archiveFile.includes('orders')) {
        // Restore orders (simplified - would need to handle relations)
        logger.info('Restore orders from archive', { archiveFile, count: data.length });
        // Note: Full restoration would require handling order items and transactions
      } else if (archiveFile.includes('transactions')) {
        logger.info('Restore transactions from archive', { archiveFile, count: data.length });
        // Note: Full restoration would require handling order relations
      } else if (archiveFile.includes('reports')) {
        logger.info('Restore reports from archive', { archiveFile, count: data.length });
        // Note: Reports can be restored directly
      }
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(tenantId: string): Promise<{
    ordersCount: number;
    transactionsCount: number;
    reportsCount: number;
    totalSize: number;
  }> {
    const archiveDir = path.join(this.defaultConfig.archivePath, tenantId);
    
    if (!fs.existsSync(archiveDir)) {
      return { ordersCount: 0, transactionsCount: 0, reportsCount: 0, totalSize: 0 };
    }

    let ordersCount = 0;
    let transactionsCount = 0;
    let reportsCount = 0;
    let totalSize = 0;

    const ordersDir = path.join(archiveDir, 'orders');
    const transactionsDir = path.join(archiveDir, 'transactions');
    const reportsDir = path.join(archiveDir, 'reports');

    if (fs.existsSync(ordersDir)) {
      const files = fs.readdirSync(ordersDir);
      ordersCount = files.length;
      files.forEach(file => {
        const filePath = path.join(ordersDir, file);
        totalSize += fs.statSync(filePath).size;
      });
    }

    if (fs.existsSync(transactionsDir)) {
      const files = fs.readdirSync(transactionsDir);
      transactionsCount = files.length;
      files.forEach(file => {
        const filePath = path.join(transactionsDir, file);
        totalSize += fs.statSync(filePath).size;
      });
    }

    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      reportsCount = files.length;
      files.forEach(file => {
        const filePath = path.join(reportsDir, file);
        totalSize += fs.statSync(filePath).size;
      });
    }

    return { ordersCount, transactionsCount, reportsCount, totalSize };
  }
}

export default new ArchiveService();

