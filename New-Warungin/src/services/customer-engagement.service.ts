/**
 * Customer Engagement Service
 * Tracks and calculates customer engagement metrics
 */

import prisma from '../config/database';
import logger from '../utils/logger';

interface CustomerEngagementMetrics {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  orderFrequency: number; // Orders per month
  engagementScore: number; // 0-100 score
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE';
  emailOpens: number;
  emailClicks: number;
  emailOpenRate: number;
  emailClickRate: number;
  campaignInteractions: number;
}

class CustomerEngagementService {
  /**
   * Calculate engagement metrics for a customer
   */
  async getCustomerEngagement(tenantId: string, customerId: string): Promise<CustomerEngagementMetrics> {
    try {
      // Get customer orders
      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          customerId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          total: true,
          createdAt: true,
        },
      });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;
      
      // Calculate days since last order
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Calculate order frequency (orders per month)
      let orderFrequency = 0;
      if (orders.length > 1) {
        const firstOrder = orders[orders.length - 1].createdAt;
        const lastOrder = orders[0].createdAt;
        const monthsDiff = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30);
        orderFrequency = monthsDiff > 0 ? totalOrders / monthsDiff : totalOrders;
      } else if (orders.length === 1) {
        orderFrequency = 1; // At least 1 order
      }

      // Get email engagement
      const emailEvents = await prisma.emailEvent.findMany({
        where: {
          tenantId,
          email: {
            in: await this.getCustomerEmails(tenantId, customerId),
          },
        },
      });

      const emailOpens = emailEvents.filter(e => e.eventType === 'OPENED').length;
      const emailClicks = emailEvents.filter(e => e.eventType === 'CLICKED').length;
      const emailSents = emailEvents.filter(e => e.eventType === 'SENT').length;
      const emailOpenRate = emailSents > 0 ? (emailOpens / emailSents) * 100 : 0;
      const emailClickRate = emailSents > 0 ? (emailClicks / emailSents) * 100 : 0;

      // Calculate engagement score (0-100)
      let engagementScore = 0;
      
      // Order-based score (0-50 points)
      if (totalOrders > 0) {
        engagementScore += Math.min(50, totalOrders * 5); // 5 points per order, max 50
      }
      
      // Recency score (0-25 points)
      if (daysSinceLastOrder !== null) {
        if (daysSinceLastOrder <= 7) engagementScore += 25;
        else if (daysSinceLastOrder <= 30) engagementScore += 15;
        else if (daysSinceLastOrder <= 90) engagementScore += 5;
      }
      
      // Frequency score (0-15 points)
      if (orderFrequency >= 4) engagementScore += 15;
      else if (orderFrequency >= 2) engagementScore += 10;
      else if (orderFrequency >= 1) engagementScore += 5;
      
      // Email engagement score (0-10 points)
      if (emailOpenRate > 50) engagementScore += 10;
      else if (emailOpenRate > 25) engagementScore += 5;
      else if (emailOpenRate > 0) engagementScore += 2;

      // Determine engagement level
      let engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE';
      if (engagementScore >= 70) engagementLevel = 'HIGH';
      else if (engagementScore >= 40) engagementLevel = 'MEDIUM';
      else if (engagementScore >= 10) engagementLevel = 'LOW';
      else engagementLevel = 'INACTIVE';

      return {
        customerId,
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        daysSinceLastOrder,
        orderFrequency: Math.round(orderFrequency * 100) / 100,
        engagementScore: Math.round(engagementScore),
        engagementLevel,
        emailOpens,
        emailClicks,
        emailOpenRate: Math.round(emailOpenRate * 100) / 100,
        emailClickRate: Math.round(emailClickRate * 100) / 100,
        campaignInteractions: emailOpens + emailClicks,
      };
    } catch (error: any) {
      logger.error('Error calculating customer engagement:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics for all customers
   */
  async getAllCustomersEngagement(tenantId: string, limit?: number) {
    try {
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        take: limit,
        select: { id: true },
      });

      const metrics = await Promise.all(
        customers.map(customer => this.getCustomerEngagement(tenantId, customer.id))
      );

      // Sort by engagement score (descending)
      return metrics.sort((a, b) => b.engagementScore - a.engagementScore);
    } catch (error: any) {
      logger.error('Error getting all customers engagement:', error);
      throw error;
    }
  }

  /**
   * Get customers by engagement level
   */
  async getCustomersByEngagementLevel(
    tenantId: string,
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE'
  ) {
    try {
      const allMetrics = await this.getAllCustomersEngagement(tenantId);
      return allMetrics.filter(m => m.engagementLevel === level);
    } catch (error: any) {
      logger.error('Error getting customers by engagement level:', error);
      throw error;
    }
  }

  /**
   * Get overall engagement statistics
   */
  async getOverallEngagementStats(tenantId: string) {
    try {
      const allMetrics = await this.getAllCustomersEngagement(tenantId);
      
      const high = allMetrics.filter(m => m.engagementLevel === 'HIGH').length;
      const medium = allMetrics.filter(m => m.engagementLevel === 'MEDIUM').length;
      const low = allMetrics.filter(m => m.engagementLevel === 'LOW').length;
      const inactive = allMetrics.filter(m => m.engagementLevel === 'INACTIVE').length;
      
      const averageScore = allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / allMetrics.length
        : 0;

      return {
        totalCustomers: allMetrics.length,
        high,
        medium,
        low,
        inactive,
        averageEngagementScore: Math.round(averageScore * 100) / 100,
        distribution: {
          high: allMetrics.length > 0 ? (high / allMetrics.length) * 100 : 0,
          medium: allMetrics.length > 0 ? (medium / allMetrics.length) * 100 : 0,
          low: allMetrics.length > 0 ? (low / allMetrics.length) * 100 : 0,
          inactive: allMetrics.length > 0 ? (inactive / allMetrics.length) * 100 : 0,
        },
      };
    } catch (error: any) {
      logger.error('Error getting overall engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get customer emails (from customer and member records)
   */
  private async getCustomerEmails(tenantId: string, customerId: string): Promise<string[]> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { email: true },
    });

    const member = await prisma.member.findFirst({
      where: { customerId, tenantId },
      include: { customer: { select: { email: true } } },
    });

    const emails: string[] = [];
    if (customer?.email) emails.push(customer.email);
    if (member?.customer?.email) emails.push(member.customer.email);

    return [...new Set(emails)]; // Remove duplicates
  }
}

export default new CustomerEngagementService();

