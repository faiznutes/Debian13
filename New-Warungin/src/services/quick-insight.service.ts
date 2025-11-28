import prisma from '../config/database';
import { AVAILABLE_ADDONS } from './addon.service';

export interface QuickInsight {
  today: {
    transactions: number;
    revenue: number;
    averageTransaction: number;
    topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
  };
  yesterday: {
    transactions: number;
    revenue: number;
    averageTransaction: number;
  };
  comparison: {
    transactionsChange: number; // percentage
    revenueChange: number; // percentage
    averageTransactionChange: number; // percentage
  };
  trends: {
    transactionsTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
  };
}

class QuickInsightService {
  private getDateRange(period: 'daily' | 'weekly' | 'monthly', isCurrent: boolean = true) {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'daily') {
      const dayOffset = isCurrent ? 0 : -1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 23, 59, 59);
    } else if (period === 'weekly') {
      const weekOffset = isCurrent ? 0 : -1;
      const currentDay = now.getDay();
      const diff = now.getDate() - currentDay + (weekOffset * 7);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
    } else { // monthly
      const monthOffset = isCurrent ? 0 : -1;
      start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
    }

    return { start, end };
  }

  async getQuickInsight(tenantId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<QuickInsight> {
    const now = new Date();
    
    // Get date ranges based on period
    const currentRange = this.getDateRange(period, true);
    const previousRange = this.getDateRange(period, false);

    // Get current period orders
    const currentOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: currentRange.start,
          lte: currentRange.end,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // Get previous period orders
    const previousOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: previousRange.start,
          lte: previousRange.end,
        },
      },
      select: {
        total: true,
      },
    });

    // Calculate current period stats
    const currentTransactions = currentOrders.length;
    const currentRevenue = currentOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    const currentAverageTransaction = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;

    // Calculate previous period stats
    const previousTransactions = previousOrders.length;
    const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    const previousAverageTransaction = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

    // Calculate top products current period
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    currentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[productId].sales += item.quantity;
        productSales[productId].revenue += parseFloat(item.product.price.toString()) * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.name,
        sales: data.sales,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Calculate comparison percentages
    const transactionsChange = previousTransactions > 0
      ? ((currentTransactions - previousTransactions) / previousTransactions) * 100
      : (currentTransactions > 0 ? 100 : 0);

    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : (currentRevenue > 0 ? 100 : 0);

    const averageTransactionChange = previousAverageTransaction > 0
      ? ((currentAverageTransaction - previousAverageTransaction) / previousAverageTransaction) * 100
      : (currentAverageTransaction > 0 ? 100 : 0);

    // Determine trends
    const transactionsTrend: 'up' | 'down' | 'stable' = 
      Math.abs(transactionsChange) < 1 ? 'stable' : transactionsChange > 0 ? 'up' : 'down';
    const revenueTrend: 'up' | 'down' | 'stable' = 
      Math.abs(revenueChange) < 1 ? 'stable' : revenueChange > 0 ? 'up' : 'down';

    return {
      today: {
        transactions: currentTransactions,
        revenue: Math.round(currentRevenue * 100) / 100,
        averageTransaction: Math.round(currentAverageTransaction * 100) / 100,
        topProducts,
      },
      yesterday: {
        transactions: previousTransactions,
        revenue: Math.round(previousRevenue * 100) / 100,
        averageTransaction: Math.round(previousAverageTransaction * 100) / 100,
      },
      comparison: {
        transactionsChange: Math.round(transactionsChange * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100,
        averageTransactionChange: Math.round(averageTransactionChange * 100) / 100,
      },
      trends: {
        transactionsTrend,
        revenueTrend,
      },
    };
  }

  async getGlobalQuickInsight(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<QuickInsight> {
    const now = new Date();
    
    // Get date ranges based on period
    const currentRange = this.getDateRange(period, true);
    const previousRange = this.getDateRange(period, false);

    // Get current period subscriptions and addons (platform revenue)
    const currentSubscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: currentRange.start,
          lte: currentRange.end,
        },
      },
      select: {
        amount: true,
      },
    });

    const currentAddons = await prisma.tenantAddon.findMany({
      where: {
        subscribedAt: {
          gte: currentRange.start,
          lte: currentRange.end,
        },
      },
      select: {
        addonId: true,
        subscribedAt: true,
        config: true,
      },
    });

    // Get previous period subscriptions and addons
    const previousSubscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: previousRange.start,
          lte: previousRange.end,
        },
      },
      select: {
        amount: true,
      },
    });

    const previousAddons = await prisma.tenantAddon.findMany({
      where: {
        subscribedAt: {
          gte: previousRange.start,
          lte: previousRange.end,
        },
      },
      select: {
        addonId: true,
        subscribedAt: true,
        config: true,
      },
    });

    // Calculate revenue from subscriptions
    const currentRevenue = currentSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount.toString()), 0);
    const previousRevenue = previousSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount.toString()), 0);

    // Calculate revenue from addons
    const addonPriceMap = new Map(AVAILABLE_ADDONS.map(a => [a.id, a.price]));

    let currentAddonRevenue = 0;
    for (const addon of currentAddons) {
      const price = addonPriceMap.get(addon.addonId) || 0;
      const duration = addon.config && typeof addon.config === 'object' && 'originalDuration' in addon.config
        ? (addon.config as any).originalDuration || 30
        : 30;
      currentAddonRevenue += (price * duration) / 30;
    }

    let previousAddonRevenue = 0;
    for (const addon of previousAddons) {
      const price = addonPriceMap.get(addon.addonId) || 0;
      const duration = addon.config && typeof addon.config === 'object' && 'originalDuration' in addon.config
        ? (addon.config as any).originalDuration || 30
        : 30;
      previousAddonRevenue += (price * duration) / 30;
    }

    const currentTotalRevenue = currentRevenue + currentAddonRevenue;
    const previousTotalRevenue = previousRevenue + previousAddonRevenue;
    const currentTransactions = currentSubscriptions.length + currentAddons.length;
    const previousTransactions = previousSubscriptions.length + previousAddons.length;
    const currentAverageTransaction = currentTransactions > 0 ? currentTotalRevenue / currentTransactions : 0;
    const previousAverageTransaction = previousTransactions > 0 ? previousTotalRevenue / previousTransactions : 0;

    // Calculate comparison percentages
    const transactionsChange = previousTransactions > 0
      ? ((currentTransactions - previousTransactions) / previousTransactions) * 100
      : (currentTransactions > 0 ? 100 : 0);

    const revenueChange = previousTotalRevenue > 0
      ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : (currentTotalRevenue > 0 ? 100 : 0);

    const averageTransactionChange = previousAverageTransaction > 0
      ? ((currentAverageTransaction - previousAverageTransaction) / previousAverageTransaction) * 100
      : (currentAverageTransaction > 0 ? 100 : 0);

    // Determine trends
    const transactionsTrend: 'up' | 'down' | 'stable' = 
      Math.abs(transactionsChange) < 1 ? 'stable' : transactionsChange > 0 ? 'up' : 'down';
    const revenueTrend: 'up' | 'down' | 'stable' = 
      Math.abs(revenueChange) < 1 ? 'stable' : revenueChange > 0 ? 'up' : 'down';

    return {
      today: {
        transactions: currentTransactions,
        revenue: Math.round(currentTotalRevenue * 100) / 100,
        averageTransaction: Math.round(currentAverageTransaction * 100) / 100,
        topProducts: [], // No top products for global view
      },
      yesterday: {
        transactions: previousTransactions,
        revenue: Math.round(previousTotalRevenue * 100) / 100,
        averageTransaction: Math.round(previousAverageTransaction * 100) / 100,
      },
      comparison: {
        transactionsChange: Math.round(transactionsChange * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100,
        averageTransactionChange: Math.round(averageTransactionChange * 100) / 100,
      },
      trends: {
        transactionsTrend,
        revenueTrend,
      },
    };
  }
}

export default new QuickInsightService();


