/**
 * Report Service
 * Uses read replica for reporting queries to reduce load on master database
 */

import prisma from '../config/database';
import { getReadReplicaClient } from '../config/database-replica';
import logger from '../utils/logger';

export class ReportService {
  /**
   * Get sales report (uses read replica)
   */
  async getSalesReport(tenantId: string, startDate: Date, endDate: Date) {
    try {
      // Use read replica for reporting
      const readReplica = getReadReplicaClient();

      const [orders, transactions] = await Promise.all([
        readReplica.order.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        }),

        readReplica.transaction.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
        }),
      ]);

      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);

      return {
        totalRevenue,
        totalOrders,
        totalItems,
        orders,
        transactions,
      };
    } catch (error: any) {
      logger.error('Error generating sales report', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Get product performance report (uses read replica)
   */
  async getProductPerformanceReport(tenantId: string, startDate: Date, endDate: Date) {
    try {
      const readReplica = getReadReplicaClient();

      const orderItems = await readReplica.orderItem.findMany({
        where: {
          order: {
            tenantId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
        },
        include: {
          product: true,
          order: true,
        },
      });

      // Group by product
      const productStats = orderItems.reduce((acc, item) => {
        const productId = item.productId;
        if (!acc[productId]) {
          acc[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
            orders: new Set(),
          };
        }
        acc[productId].quantity += item.quantity;
        acc[productId].revenue += Number(item.price) * item.quantity;
        acc[productId].orders.add(item.orderId);
        return acc;
      }, {} as Record<string, any>);

      // Convert to array and calculate order count
      return Object.values(productStats).map((stat: any) => ({
        product: stat.product,
        quantity: stat.quantity,
        revenue: stat.revenue,
        orderCount: stat.orders.size,
      }));
    } catch (error: any) {
      logger.error('Error generating product performance report', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Get customer analytics (uses read replica)
   */
  async getCustomerAnalytics(tenantId: string, startDate: Date, endDate: Date) {
    try {
      const readReplica = getReadReplicaClient();

      const customers = await readReplica.customer.findMany({
        where: {
          tenantId,
        },
        include: {
          orders: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
              status: 'COMPLETED',
            },
            include: {
              items: true,
            },
          },
        },
      });

      return customers.map((customer) => {
        const totalSpent = customer.orders.reduce(
          (sum, order) => sum + Number(order.total),
          0
        );
        const orderCount = customer.orders.length;

        return {
          customer,
          totalSpent,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        };
      });
    } catch (error: any) {
      logger.error('Error generating customer analytics', { error: error.message, tenantId });
      throw error;
    }
  }

  // Stub methods for compatibility with routes
  async getGlobalReport(start?: Date, end?: Date) {
    try {
      const readReplica = getReadReplicaClient();
      const tenants = await readReplica.tenant.findMany({
        include: {
          subscriptions: true,
          _count: {
            select: {
              users: true,
              orders: true,
            },
          },
        },
      });

      return {
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.isActive).length,
        totalUsers: tenants.reduce((sum, t) => sum + t._count.users, 0),
        totalOrders: tenants.reduce((sum, t) => sum + t._count.orders, 0),
        tenants,
      };
    } catch (error: any) {
      logger.error('Error generating global report', { error: error.message });
      throw error;
    }
  }

  async getTenantReport(tenantId: string, start?: Date, end?: Date, type: string = 'sales') {
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end || new Date();

    switch (type) {
      case 'sales':
        return this.getSalesReport(tenantId, startDate, endDate);
      case 'products':
        return this.getProductPerformanceReport(tenantId, startDate, endDate);
      case 'customers':
        return this.getCustomerAnalytics(tenantId, startDate, endDate);
      default:
        return this.getSalesReport(tenantId, startDate, endDate);
    }
  }

  async generateSalesReport(tenantId: string, options: any) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    return this.getSalesReport(tenantId, startDate, endDate);
  }

  async generateProductReport(tenantId: string, options: any) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    return this.getProductPerformanceReport(tenantId, startDate, endDate);
  }

  async generateCustomerReport(tenantId: string, options: any) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    return this.getCustomerAnalytics(tenantId, startDate, endDate);
  }

  async generateInventoryReport(tenantId: string, options: any) {
    try {
      const readReplica = getReadReplicaClient();
      const products = await readReplica.product.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });
      return products;
    } catch (error: any) {
      logger.error('Error generating inventory report', { error: error.message, tenantId });
      throw error;
    }
  }

  async generateFinancialReport(tenantId: string, options: any) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    return this.getSalesReport(tenantId, startDate, endDate);
  }

  generateGlobalReportPDF(report: any, start?: Date, end?: Date): string {
    return `<html><body><h1>Global Report</h1><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`;
  }
}

export default new ReportService();
