/**
 * AI/ML Service
 * Handles AI/ML features: Sales Forecasting, Product Recommendation, Customer Segmentation, Price Optimization
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import orderService from './order.service';
import productService from './product.service';

interface SalesForecast {
  period: string; // YYYY-MM
  predictedRevenue: number;
  confidence: number; // 0-1
  factors: {
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    seasonality: number;
    growthRate: number;
  };
}

interface ProductRecommendation {
  productId: string;
  productName: string;
  recommendationScore: number; // 0-1
  reason: string;
  type: 'FREQUENTLY_BOUGHT_TOGETHER' | 'SIMILAR_PRODUCTS' | 'TRENDING' | 'PERSONALIZED';
}

interface CustomerSegment {
  segmentId: string;
  segmentName: string;
  criteria: Record<string, any>;
  customerCount: number;
  averageOrderValue: number;
  purchaseFrequency: number;
}

class AIMLService {
  /**
   * Sales Forecasting with ML model
   */
  async forecastSales(
    tenantId: string,
    months: number = 6
  ): Promise<SalesForecast[]> {
    try {
      logger.info(`Generating sales forecast for ${months} months`);

      // Get historical sales data
      const now = new Date();
      const historicalData = [];
      
      for (let i = 12; i > 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const orders = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: date,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
        });

        const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        historicalData.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          revenue,
          orderCount: orders.length,
        });
      }

      // Simple time series forecasting (can be enhanced with ML model)
      const forecasts: SalesForecast[] = [];
      const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
      const growthRate = this.calculateGrowthRate(historicalData);
      const seasonality = this.calculateSeasonality(historicalData);

      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Simple linear regression with seasonality
        const baseForecast = avgRevenue * (1 + growthRate * i);
        const seasonalAdjustment = seasonality[futureDate.getMonth()] || 1;
        const predictedRevenue = baseForecast * seasonalAdjustment;
        
        // Confidence decreases over time
        const confidence = Math.max(0.3, 1 - (i * 0.1));

        forecasts.push({
          period: monthStr,
          predictedRevenue: Math.max(0, predictedRevenue),
          confidence,
          factors: {
            trend: growthRate > 0.05 ? 'INCREASING' : growthRate < -0.05 ? 'DECREASING' : 'STABLE',
            seasonality: seasonalAdjustment,
            growthRate,
          },
        });
      }

      return forecasts;
    } catch (error: any) {
      logger.error('Error forecasting sales:', error);
      throw error;
    }
  }

  /**
   * Calculate growth rate from historical data
   */
  private calculateGrowthRate(data: Array<{ revenue: number }>): number {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;
    
    if (firstAvg === 0) return 0;
    return (secondAvg - firstAvg) / firstAvg;
  }

  /**
   * Calculate seasonality factors
   */
  private calculateSeasonality(data: Array<{ month: string; revenue: number }>): Record<number, number> {
    const monthlyTotals: Record<number, number[]> = {};
    
    data.forEach(d => {
      const month = parseInt(d.month.split('-')[1]) - 1; // 0-11
      if (!monthlyTotals[month]) monthlyTotals[month] = [];
      monthlyTotals[month].push(d.revenue);
    });

    const avgRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
    const seasonality: Record<number, number> = {};

    for (let month = 0; month < 12; month++) {
      if (monthlyTotals[month]) {
        const monthAvg = monthlyTotals[month].reduce((sum, r) => sum + r, 0) / monthlyTotals[month].length;
        seasonality[month] = avgRevenue > 0 ? monthAvg / avgRevenue : 1;
      } else {
        seasonality[month] = 1;
      }
    }

    return seasonality;
  }

  /**
   * Get product recommendations
   */
  async getProductRecommendations(
    tenantId: string,
    customerId?: string,
    productId?: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations: ProductRecommendation[] = [];

      if (productId) {
        // Frequently bought together
        const fbtRecommendations = await this.getFrequentlyBoughtTogether(tenantId, productId, limit);
        recommendations.push(...fbtRecommendations);
      }

      if (customerId) {
        // Personalized recommendations based on purchase history
        const personalizedRecommendations = await this.getPersonalizedRecommendations(tenantId, customerId, limit);
        recommendations.push(...personalizedRecommendations);
      }

      // Trending products
      const trendingRecommendations = await this.getTrendingProducts(tenantId, limit);
      recommendations.push(...trendingRecommendations);

      // Remove duplicates and sort by score
      const uniqueRecommendations = recommendations.reduce((acc, rec) => {
        if (!acc.find(r => r.productId === rec.productId)) {
          acc.push(rec);
        }
        return acc;
      }, [] as ProductRecommendation[]);

      return uniqueRecommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error: any) {
      logger.error('Error getting product recommendations:', error);
      throw error;
    }
  }

  /**
   * Get frequently bought together products
   */
  private async getFrequentlyBoughtTogether(
    tenantId: string,
    productId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    // Get orders containing this product
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        items: {
          some: { productId },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Count co-occurrences
    const coOccurrences: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId !== productId) {
          coOccurrences[item.productId] = (coOccurrences[item.productId] || 0) + 1;
        }
      });
    });

    // Get top co-occurring products
    const topProducts = Object.entries(coOccurrences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    const recommendations: ProductRecommendation[] = [];
    for (const [productId, count] of topProducts) {
      const product = await productService.getProductById(productId, tenantId);
      if (product) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          recommendationScore: count / orders.length,
          reason: `Frequently bought together (${count} times)`,
          type: 'FREQUENTLY_BOUGHT_TOGETHER',
        });
      }
    }

    return recommendations;
  }

  /**
   * Get personalized recommendations
   */
  private async getPersonalizedRecommendations(
    tenantId: string,
    customerId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    // Get customer purchase history
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        customerId,
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                orderItems: {
                  where: {
                    order: {
                      tenantId,
                      status: 'COMPLETED',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Recommend products similar to what customer bought
    const recommendations: ProductRecommendation[] = [];
    // Simplified - in production, use collaborative filtering or content-based filtering

    return recommendations;
  }

  /**
   * Get trending products
   */
  private async getTrendingProducts(
    tenantId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      include: {
        product: true,
      },
    });

    // Count sales per product
    const productSales: Record<string, { count: number; product: any }> = {};
    orderItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { count: 0, product: item.product };
      }
      productSales[item.productId].count += item.quantity;
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit);

    return topProducts.map(([productId, data]) => ({
      productId,
      productName: data.product.name,
      recommendationScore: Math.min(1, data.count / 100), // Normalize score
      reason: `Trending product (${data.count} sold in last 30 days)`,
      type: 'TRENDING',
    }));
  }

  /**
   * Customer Segmentation
   */
  async segmentCustomers(tenantId: string): Promise<CustomerSegment[]> {
    try {
      // Get all customers with their order history
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        include: {
          orders: {
            where: { status: 'COMPLETED' },
            include: { items: true },
          },
        },
      });

      // Calculate metrics for each customer
      const customerMetrics = customers.map(customer => {
        const totalOrders = customer.orders.length;
        const totalSpent = customer.orders.reduce(
          (sum, order) => sum + parseFloat(order.total.toString()),
          0
        );
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const daysSinceLastOrder = customer.orders.length > 0
          ? Math.floor((Date.now() - customer.orders[customer.orders.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          customerId: customer.id,
          totalOrders,
          totalSpent,
          avgOrderValue,
          daysSinceLastOrder,
        };
      });

      // Segment customers
      const segments: CustomerSegment[] = [
        {
          segmentId: 'vip',
          segmentName: 'VIP Customers',
          criteria: { avgOrderValue: { gte: 100000 }, totalOrders: { gte: 10 } },
          customerCount: customerMetrics.filter(m => m.avgOrderValue >= 100000 && m.totalOrders >= 10).length,
          averageOrderValue: 0,
          purchaseFrequency: 0,
        },
        {
          segmentId: 'regular',
          segmentName: 'Regular Customers',
          criteria: { totalOrders: { gte: 3 }, daysSinceLastOrder: { lte: 30 } },
          customerCount: customerMetrics.filter(m => m.totalOrders >= 3 && m.daysSinceLastOrder <= 30).length,
          averageOrderValue: 0,
          purchaseFrequency: 0,
        },
        {
          segmentId: 'at-risk',
          segmentName: 'At-Risk Customers',
          criteria: { daysSinceLastOrder: { gte: 90 }, totalOrders: { gte: 1 } },
          customerCount: customerMetrics.filter(m => m.daysSinceLastOrder >= 90 && m.totalOrders >= 1).length,
          averageOrderValue: 0,
          purchaseFrequency: 0,
        },
        {
          segmentId: 'new',
          segmentName: 'New Customers',
          criteria: { totalOrders: { eq: 1 } },
          customerCount: customerMetrics.filter(m => m.totalOrders === 1).length,
          averageOrderValue: 0,
          purchaseFrequency: 0,
        },
      ];

      // Calculate averages for each segment
      segments.forEach(segment => {
        const segmentCustomers = customerMetrics.filter(m => {
          if (segment.segmentId === 'vip') {
            return m.avgOrderValue >= 100000 && m.totalOrders >= 10;
          } else if (segment.segmentId === 'regular') {
            return m.totalOrders >= 3 && m.daysSinceLastOrder <= 30;
          } else if (segment.segmentId === 'at-risk') {
            return m.daysSinceLastOrder >= 90 && m.totalOrders >= 1;
          } else if (segment.segmentId === 'new') {
            return m.totalOrders === 1;
          }
          return false;
        });

        if (segmentCustomers.length > 0) {
          segment.averageOrderValue = segmentCustomers.reduce((sum, c) => sum + c.avgOrderValue, 0) / segmentCustomers.length;
          segment.purchaseFrequency = segmentCustomers.reduce((sum, c) => sum + c.totalOrders, 0) / segmentCustomers.length;
        }
      });

      return segments;
    } catch (error: any) {
      logger.error('Error segmenting customers:', error);
      throw error;
    }
  }

  /**
   * Price Optimization
   */
  async optimizePrice(
    tenantId: string,
    productId: string
  ): Promise<{
    currentPrice: number;
    recommendedPrice: number;
    confidence: number;
    factors: {
      demand: number;
      competition: number;
      profitMargin: number;
    };
  }> {
    try {
      const product = await productService.getProductById(productId, tenantId);
      if (!product) {
        throw new Error('Product not found');
      }

      const currentPrice = parseFloat(product.price.toString());

      // Get sales data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orderItems = await prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            tenantId,
            status: 'COMPLETED',
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      });

      const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const demand = totalSold / 30; // Units per day

      // Simple price optimization (can be enhanced with ML)
      // Consider: demand elasticity, profit margin, competition
      const cost = parseFloat(product.cost?.toString() || '0');
      const profitMargin = cost > 0 ? (currentPrice - cost) / currentPrice : 0.3;

      // Recommended price based on demand and profit margin
      let recommendedPrice = currentPrice;
      if (demand < 1 && profitMargin > 0.2) {
        // Low demand, reduce price
        recommendedPrice = currentPrice * 0.9;
      } else if (demand > 5 && profitMargin < 0.4) {
        // High demand, can increase price
        recommendedPrice = currentPrice * 1.1;
      }

      return {
        currentPrice,
        recommendedPrice: Math.max(cost * 1.1, recommendedPrice), // Ensure minimum profit
        confidence: 0.7,
        factors: {
          demand,
          competition: 0, // TODO: Get from competitor monitoring
          profitMargin,
        },
      };
    } catch (error: any) {
      logger.error('Error optimizing price:', error);
      throw error;
    }
  }
}

export default new AIMLService();

