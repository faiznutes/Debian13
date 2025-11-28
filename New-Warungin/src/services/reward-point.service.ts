import prisma from '../config/database';
import subscriptionService from './subscription.service';
import addonService from './addon.service';

// Point Configuration
// 1 point = 200 rupiah
const POINT_PER_RUPIAH = 200;

const POINT_CONFIG = {
  // Point conversion rate
  POINT_PER_RUPIAH,
  
  // Subscription redemption (calculated from price: price / 200)
  // BASIC: 200000rp = 1000pts, PRO: 350000rp = 1750pts, ENTERPRISE: 500000rp = 2500pts
  SUBSCRIPTION: {
    '1month_starter': 1000,      // BASIC: 200000rp / 200 = 1000 pts
    '1month_boost': 1750,        // PRO: 350000rp / 200 = 1750 pts
    '1month_max': 2500,          // ENTERPRISE: 500000rp / 200 = 2500 pts
  },
  
  // Addon redemption (calculated from price: price / 200)
  ADDONS: {
    'add_outlets': 600,          // 120000rp / 200 = 600 pts
    'add_users': 250,            // 50000rp / 200 = 250 pts
    'add_products': 150,         // 30000rp / 200 = 150 pts
    'business_analytics': 1250,  // 250000rp / 200 = 1250 pts
    'export_reports': 375,       // 75000rp / 200 = 375 pts
    'receipt_editor': 250,       // 50000rp / 200 = 250 pts
  },
  
  // Point expiration (days) - 6 bulan = 180 hari
  EXPIRATION_DAYS: 180,
  
  // Daily limits
  MAX_ADS_PER_DAY: 5,
  
  // Point generation probabilities
  PROBABILITIES: {
    1: 0.60,  // 60%
    2: 0.39,  // 39%
    3: 0.01,  // 1%
  },
};

export class RewardPointService {
  /**
   * Generate random points dengan probability:
   * - 1 point: 60%
   * - 2 points: 39%
   * - 3 points: 1%
   */
  private generateRandomPoints(): number {
    const random = Math.random();
    if (random < 0.60) return 1;      // 60%
    if (random < 0.99) return 2;      // 39% (0.60 + 0.39)
    return 3;                         // 1% (0.99 + 0.01)
  }

  /**
   * Check daily ad view limit (max 5 per day)
   */
  async checkDailyLimit(tenantId: string, userId?: string): Promise<{
    canView: boolean;
    remaining: number;
    todayViews: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userIdKey = userId || '';

    const dailyView = await prisma.dailyAdView.findUnique({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId: userIdKey,
          date: today,
        },
      },
    });

    const todayViews = dailyView?.viewCount || 0;
    const canView = todayViews < POINT_CONFIG.MAX_ADS_PER_DAY;
    const remaining = Math.max(0, POINT_CONFIG.MAX_ADS_PER_DAY - todayViews);

    return { canView, remaining, todayViews };
  }

  /**
   * Record ad view dan berikan points
   */
  async recordAdView(
    tenantId: string,
    userId: string,
    adMetadata?: {
      timestamp?: string;
      sessionId?: string;
      adProvider?: string;
      appKey?: string;
      [key: string]: any;
    }
  ): Promise<{
    success: boolean;
    pointsEarned: number;
    totalPoints: number;
    remainingViews: number;
    message: string;
  }> {
    // Check daily limit
    const limitCheck = await this.checkDailyLimit(tenantId, userId);
    if (!limitCheck.canView) {
      return {
        success: false,
        pointsEarned: 0,
        totalPoints: 0,
        remainingViews: 0,
        message: 'Batas harian menonton iklan sudah tercapai (5 iklan/hari)',
      };
    }

    // Generate random points
    const pointsEarned = this.generateRandomPoints();

    // Get or create reward point record
    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    let rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    if (!rewardPoint) {
      rewardPoint = await prisma.rewardPoint.create({
        data: {
          tenantId,
          userId: userId || null,
          currentPoints: 0,
          totalEarned: 0,
        },
      });
    }

    // Update daily ad view count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyAdView.upsert({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId: userId || '',
          date: today,
        },
      },
      update: {
        viewCount: { increment: 1 },
        lastViewAt: new Date(),
      },
      create: {
        tenantId,
        userId: userId || '',
        date: today,
        viewCount: 1,
        lastViewAt: new Date(),
      },
    });

    // Add points
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { increment: pointsEarned },
        totalEarned: { increment: pointsEarned },
        lastEarnedAt: new Date(),
      },
    });

    // Record transaction dengan expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);

    await prisma.rewardPointTransaction.create({
      data: {
        rewardPointId: updated.id,
        type: 'EARNED',
        amount: pointsEarned,
        source: 'AD_VIEW',
        description: `Menonton iklan ${adMetadata?.adProvider || 'IronSource'} - Mendapat ${pointsEarned} point`,
        metadata: {
          ...(adMetadata || {}),
          expirationDate: expirationDate.toISOString(),
          adProvider: adMetadata?.adProvider || 'IronSource',
          appKey: adMetadata?.appKey || '244d3c355',
          placementName: adMetadata?.placementName || '0aoy03hfxtsvzcix',
        },
      },
    });

    return {
      success: true,
      pointsEarned,
      totalPoints: updated.currentPoints,
      remainingViews: limitCheck.remaining - 1,
      message: `Selamat! Anda mendapat ${pointsEarned} point`,
    };
  }

  /**
   * Check and expire old points (180 days)
   */
  async checkAndExpirePoints(tenantId: string, userId?: string | null): Promise<number> {
    const userIdKey: string | null = userId || null;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - POINT_CONFIG.EXPIRATION_DAYS);

    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    const rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userIdKey || null,
      },
    });

    if (!rewardPoint) {
      return 0;
    }

    // Get all EARNED transactions that are older than expiration date
    const expiredTransactions = await prisma.rewardPointTransaction.findMany({
      where: {
        rewardPointId: rewardPoint.id,
        type: 'EARNED',
        source: 'AD_VIEW',
        createdAt: {
          lt: expirationDate,
        },
      },
    });

    // Filter out already expired transactions in JavaScript
    const notExpiredTransactions = expiredTransactions.filter((tx: { metadata: any; createdAt: Date }) => {
      const metadata = tx.metadata as any;
      return !metadata?.expired;
    });

    if (notExpiredTransactions.length === 0) {
      return 0;
    }

    // Calculate total expired points
    let totalExpired = 0;
    const now = new Date();

    for (const transaction of notExpiredTransactions) {
      const metadata = transaction.metadata as any;
      const transactionDate = new Date(transaction.createdAt);
      const transactionExpirationDate = metadata?.expirationDate
        ? new Date(metadata.expirationDate)
        : new Date(transactionDate.getTime() + POINT_CONFIG.EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

      // Check if transaction is expired
      if (now > transactionExpirationDate && transaction.amount > 0) {
        totalExpired += transaction.amount;

        // Mark transaction as expired
        await prisma.rewardPointTransaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...metadata,
              expired: true,
              expiredAt: now.toISOString(),
            },
          },
        });
      }
    }

    if (totalExpired > 0) {
      // Deduct expired points
      await prisma.rewardPoint.update({
        where: { id: rewardPoint.id },
        data: {
          currentPoints: {
            decrement: totalExpired,
          },
        },
      });

      // Record expiration transaction
      await prisma.rewardPointTransaction.create({
        data: {
          rewardPointId: rewardPoint.id,
          type: 'EXPIRED',
          amount: -totalExpired,
          source: 'AUTO_EXPIRE',
          description: `${totalExpired} point kadaluarsa (${POINT_CONFIG.EXPIRATION_DAYS} hari)`,
          metadata: {
            expiredCount: expiredTransactions.length,
            expirationDate: expirationDate.toISOString(),
          },
        },
      });
    }

    return totalExpired;
  }

  /**
   * Get reward points balance (with expiration check)
   * Combines tenant-level points with user-level points
   */
  async getBalance(tenantId: string, userId?: string) {
    const userIdKey: string | null = userId || null;

    // Check and expire old points first (both tenant and user level)
    await this.checkAndExpirePoints(tenantId, null); // Tenant level
    if (userId) {
      await this.checkAndExpirePoints(tenantId, userId); // User level
    }

    // Get tenant-level points (shared pool)
    const tenantRewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: null,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    // Get user-level points (individual)
    let userRewardPoint = null;
    if (userId) {
      userRewardPoint = await prisma.rewardPoint.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: userIdKey as any,
          },
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });
    }

    // Combine tenant-level and user-level points
    const tenantPoints = tenantRewardPoint?.currentPoints || 0;
    const userPoints = userRewardPoint?.currentPoints || 0;
    const combinedPoints = tenantPoints + userPoints;

    const tenantEarned = tenantRewardPoint?.totalEarned || 0;
    const userEarned = userRewardPoint?.totalEarned || 0;
    const combinedEarned = tenantEarned + userEarned;

    const tenantSpent = tenantRewardPoint?.totalSpent || 0;
    const userSpent = userRewardPoint?.totalSpent || 0;
    const combinedSpent = tenantSpent + userSpent;

    // Combine transactions (prioritize user-level, then tenant-level)
    const allTransactions = [
      ...(userRewardPoint?.transactions || []),
      ...(tenantRewardPoint?.transactions || []),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

    // Calculate points that will expire soon (within 30 days)
    let expiringSoon = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Check both tenant and user transactions
    const rewardPointIds = [
      ...(tenantRewardPoint ? [tenantRewardPoint.id] : []),
      ...(userRewardPoint ? [userRewardPoint.id] : []),
    ];

    if (rewardPointIds.length > 0) {
      const allEarnedTransactions = await prisma.rewardPointTransaction.findMany({
        where: {
          rewardPointId: { in: rewardPointIds },
          type: 'EARNED',
          source: 'AD_VIEW',
        },
      });

      // Filter out already expired transactions
      const notExpiredTransactions = allEarnedTransactions.filter((tx: { metadata: any; createdAt: Date }) => {
        const metadata = tx.metadata as any;
        return !metadata?.expired;
      });

      for (const transaction of notExpiredTransactions) {
        const metadata = transaction.metadata as any;
        const transactionDate = new Date(transaction.createdAt);
        const transactionExpirationDate = metadata?.expirationDate
          ? new Date(metadata.expirationDate)
          : new Date(transactionDate.getTime() + POINT_CONFIG.EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

        // Check if expiration is within 30 days
        if (transactionExpirationDate > now && transactionExpirationDate <= thirtyDaysFromNow) {
          expiringSoon += transaction.amount;
        }
      }
    }

    return {
      currentPoints: combinedPoints,
      totalEarned: combinedEarned,
      totalSpent: combinedSpent,
      transactions: allTransactions,
      expiringSoon,
      expirationDays: POINT_CONFIG.EXPIRATION_DAYS,
      // Include breakdown for debugging
      _breakdown: {
        tenantLevel: tenantPoints,
        userLevel: userPoints,
      },
    };
  }

  /**
   * Get transactions history
   */
  async getTransactions(tenantId: string, userId?: string, limit: number = 50) {
    const userIdKey: string | null = userId || null;

    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    const rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userIdKey || null,
      },
    });

    if (!rewardPoint) {
      return [];
    }

    const transactions = await prisma.rewardPointTransaction.findMany({
      where: {
        rewardPointId: rewardPoint.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  }

  /**
   * Redeem points untuk subscription
   */
  async redeemForSubscription(
    tenantId: string,
    userId: string,
    planId: string,
    pointsRequired: number
  ) {
    const rewardPoint = await prisma.rewardPoint.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!rewardPoint || rewardPoint.currentPoints < pointsRequired) {
      throw new Error('Point tidak cukup');
    }

    // Map planId to actual plan
    const planMapping: Record<string, 'BASIC' | 'PRO' | 'ENTERPRISE'> = {
      '1month_starter': 'BASIC',
      '1month_boost': 'PRO',
      '1month_max': 'ENTERPRISE',
    };

    const plan = planMapping[planId];
    if (!plan) {
      throw new Error('Plan tidak valid');
    }

    // Deduct points first
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { decrement: pointsRequired },
        totalSpent: { increment: pointsRequired },
      },
    });

    try {
      // Extend subscription dengan 1 bulan (30 hari)
      await subscriptionService.extendSubscription(tenantId, {
        plan,
        duration: 30, // 1 bulan
      });

      // Record transaction
      await prisma.rewardPointTransaction.create({
        data: {
          rewardPointId: updated.id,
          type: 'SPENT',
          amount: -pointsRequired,
          source: 'SUBSCRIPTION_REDEEM',
          description: `Tukar ${pointsRequired} point untuk langganan ${plan} (1 bulan)`,
          metadata: { planId, plan, pointsRequired, duration: 30 },
        },
      });

      return updated;
    } catch (error: any) {
      // Rollback points if subscription extension fails
      await prisma.rewardPoint.update({
        where: { id: rewardPoint.id },
        data: {
          currentPoints: { increment: pointsRequired },
          totalSpent: { decrement: pointsRequired },
        },
      });
      throw new Error(`Gagal memperpanjang langganan: ${error.message}`);
    }
  }

  /**
   * Redeem points untuk addon
   */
  async redeemForAddon(
    tenantId: string,
    userId: string,
    addonId: string,
    addonName: string,
    pointsRequired: number
  ) {
    const rewardPoint = await prisma.rewardPoint.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!rewardPoint || rewardPoint.currentPoints < pointsRequired) {
      throw new Error('Point tidak cukup');
    }

    // Map addonId to addon type and config
    const addonMapping: Record<string, {
      addonId: string;
      addonType: string;
      addonName: string;
      limit?: number;
      duration?: number;
    }> = {
      // Support both old and new IDs for backward compatibility
      'add_users_5': {
        addonId: 'add_users',
        addonType: 'ADD_USERS',
        addonName: 'Tambah Pengguna',
        limit: 5,
      },
      'add_users': {
        addonId: 'add_users',
        addonType: 'ADD_USERS',
        addonName: 'Tambah Pengguna',
        limit: 5,
      },
      'add_products_100': {
        addonId: 'add_products',
        addonType: 'ADD_PRODUCTS',
        addonName: 'Tambah Produk',
        limit: 100,
      },
      'add_products': {
        addonId: 'add_products',
        addonType: 'ADD_PRODUCTS',
        addonName: 'Tambah Produk',
        limit: 100,
      },
      'add_outlet_1': {
        addonId: 'add_outlets',
        addonType: 'ADD_OUTLETS',
        addonName: 'Tambah Outlet',
        limit: 1,
      },
      'add_outlets': {
        addonId: 'add_outlets',
        addonType: 'ADD_OUTLETS',
        addonName: 'Tambah Outlet',
        limit: 1,
      },
      'business_analytics': {
        addonId: 'business_analytics',
        addonType: 'BUSINESS_ANALYTICS',
        addonName: 'Business Analytics & Insight',
      },
      'export_reports': {
        addonId: 'export_reports',
        addonType: 'EXPORT_REPORTS',
        addonName: 'Export Laporan',
      },
      'receipt_editor': {
        addonId: 'receipt_editor',
        addonType: 'RECEIPT_EDITOR',
        addonName: 'Simple Nota Editor',
      },
    };

    const addonConfig = addonMapping[addonId];
    if (!addonConfig) {
      throw new Error('Addon tidak valid');
    }

    // Deduct points first
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { decrement: pointsRequired },
        totalSpent: { increment: pointsRequired },
      },
    });

    try {
      // Subscribe addon
      await addonService.subscribeAddon(tenantId, {
        addonId: addonConfig.addonId,
        addonName: addonConfig.addonName,
        addonType: addonConfig.addonType,
        limit: addonConfig.limit,
        duration: addonConfig.duration || 30, // Default 30 hari
      });

      // Record transaction
      await prisma.rewardPointTransaction.create({
        data: {
          rewardPointId: updated.id,
          type: 'SPENT',
          amount: -pointsRequired,
          source: 'ADDON_REDEEM',
          description: `Tukar ${pointsRequired} point untuk addon ${addonConfig.addonName}`,
          metadata: { addonId, addonName: addonConfig.addonName, pointsRequired, addonType: addonConfig.addonType },
        },
      });

      return updated;
    } catch (error: any) {
      // Rollback points if addon subscription fails
      await prisma.rewardPoint.update({
        where: { id: rewardPoint.id },
        data: {
          currentPoints: { increment: pointsRequired },
          totalSpent: { decrement: pointsRequired },
        },
      });
      throw new Error(`Gagal mengaktifkan addon: ${error.message}`);
    }
  }

  /**
   * Get point configuration
   */
  getPointConfig() {
    return POINT_CONFIG;
  }

  /**
   * Get available redemption options
   */
  getAvailableRedemptions() {
    const subscriptionNames: Record<string, string> = {
      '1month_starter': 'Starter (BASIC)',
      '1month_boost': 'Boost (PRO)',
      '1month_max': 'Max (ENTERPRISE)',
    };

    const addonNames: Record<string, string> = {
      'add_outlets': 'Tambah Outlet',
      'add_users': 'Tambah Pengguna',
      'add_products': 'Tambah Produk',
      'business_analytics': 'Business Analytics & Insight',
      'export_reports': 'Export Laporan',
      'receipt_editor': 'Simple Nota Editor',
    };

    return {
      subscriptions: Object.entries(POINT_CONFIG.SUBSCRIPTION).map(([id, points]) => ({
        id,
        pointsRequired: points,
        name: subscriptionNames[id] || id.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
      addons: Object.entries(POINT_CONFIG.ADDONS).map(([id, points]) => ({
        id,
        pointsRequired: points,
        name: addonNames[id] || id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    };
  }

  /**
   * Get expiration info for a specific transaction
   */
  getExpirationDate(transactionDate: Date): Date {
    const expirationDate = new Date(transactionDate);
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);
    return expirationDate;
  }

  /**
   * Get days until expiration for a transaction
   */
  getDaysUntilExpiration(transactionDate: Date): number {
    const expirationDate = this.getExpirationDate(transactionDate);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Award points from subscription purchase
   * 10rb = 5 point (1rb = 0.5 point, rounded down to integer)
   * @param tenantId - Tenant ID
   * @param amount - Subscription amount in rupiah
   * @param plan - Subscription plan
   * @param duration - Duration in days
   */
  async awardPointsFromSubscription(
    tenantId: string,
    amount: number,
    plan: string,
    duration: number
  ): Promise<{ pointsAwarded: number; totalPoints: number }> {
    // Calculate points: 10rb = 5 point, so 1rb = 0.5 point
    // Use Math.floor to ensure integer only
    const pointsAwarded = Math.floor((amount / 10000) * 5);
    
    if (pointsAwarded <= 0) {
      return { pointsAwarded: 0, totalPoints: 0 };
    }

    // Use null userId for tenant-level points
    const userId: string | null = null;

    // Get or create reward point record
    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    let rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    if (!rewardPoint) {
      rewardPoint = await prisma.rewardPoint.create({
        data: {
          tenantId,
          userId: userId || null,
          currentPoints: 0,
          totalEarned: 0,
        },
      });
    }

    // Add points
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { increment: pointsAwarded },
        totalEarned: { increment: pointsAwarded },
        lastEarnedAt: new Date(),
      },
    });

    // Record transaction dengan expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);

    await prisma.rewardPointTransaction.create({
      data: {
        rewardPointId: updated.id,
        type: 'EARNED',
        amount: pointsAwarded,
        source: 'SUBSCRIPTION_PURCHASE',
        description: `Berlangganan ${plan} (${duration} hari) - Mendapat ${pointsAwarded} point`,
        metadata: {
          subscriptionPlan: plan,
          subscriptionAmount: amount,
          subscriptionDuration: duration,
          expirationDate: expirationDate.toISOString(),
        },
      },
    });

    return {
      pointsAwarded,
      totalPoints: updated.currentPoints,
    };
  }

  /**
   * Award points from addon purchase
   * 10rb = 5 point (1rb = 0.5 point, rounded down to integer)
   * @param tenantId - Tenant ID
   * @param amount - Addon amount in rupiah
   * @param addonName - Addon name
   * @param addonType - Addon type
   */
  async awardPointsFromAddon(
    tenantId: string,
    amount: number,
    addonName: string,
    addonType: string
  ): Promise<{ pointsAwarded: number; totalPoints: number }> {
    // Calculate points: 10rb = 5 point, so 1rb = 0.5 point
    // Use Math.floor to ensure integer only
    const pointsAwarded = Math.floor((amount / 10000) * 5);
    
    if (pointsAwarded <= 0) {
      return { pointsAwarded: 0, totalPoints: 0 };
    }

    // Use null userId for tenant-level points
    const userId: string | null = null;

    // Get or create reward point record
    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    let rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    if (!rewardPoint) {
      rewardPoint = await prisma.rewardPoint.create({
        data: {
          tenantId,
          userId: userId || null,
          currentPoints: 0,
          totalEarned: 0,
        },
      });
    }

    // Add points
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { increment: pointsAwarded },
        totalEarned: { increment: pointsAwarded },
        lastEarnedAt: new Date(),
      },
    });

    // Record transaction dengan expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);

    await prisma.rewardPointTransaction.create({
      data: {
        rewardPointId: updated.id,
        type: 'EARNED',
        amount: pointsAwarded,
        source: 'ADDON_PURCHASE',
        description: `Berlangganan addon ${addonName} - Mendapat ${pointsAwarded} point`,
        metadata: {
          addonName,
          addonType,
          addonAmount: amount,
          expirationDate: expirationDate.toISOString(),
        },
      },
    });

    return {
      pointsAwarded,
      totalPoints: updated.currentPoints,
    };
  }

  /**
   * Get tenant reward points balance (for super admin)
   * @param tenantId - Tenant ID
   */
  async getTenantBalance(tenantId: string) {
    const userId: string | null = null;
    
    // Check and expire old points first
    await this.checkAndExpirePoints(tenantId, userId);

    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    const rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    return {
      ...(rewardPoint || {
        currentPoints: 0,
        totalEarned: 0,
        totalSpent: 0,
      }),
    };
  }

  /**
   * Update user reward points (for admin tenant or super admin)
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param points - Points to add (can be negative)
   * @param reason - Reason for the update
   */
  async updateUserPoints(
    tenantId: string,
    userId: string,
    points: number,
    reason: string
  ): Promise<{ success: boolean; newBalance: number; message: string }> {
    // Ensure points is integer
    const pointsToAdd = Math.floor(points);
    
    if (pointsToAdd === 0) {
      return {
        success: false,
        newBalance: 0,
        message: 'Point harus lebih dari 0',
      };
    }

    // Get or create reward point record for this user
    let rewardPoint = await prisma.rewardPoint.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!rewardPoint) {
      rewardPoint = await prisma.rewardPoint.create({
        data: {
          tenantId,
          userId,
          currentPoints: 0,
          totalEarned: 0,
        },
      });
    }

    // Check if deducting and balance is sufficient
    if (pointsToAdd < 0 && rewardPoint.currentPoints < Math.abs(pointsToAdd)) {
      return {
        success: false,
        newBalance: rewardPoint.currentPoints,
        message: `Point tidak cukup. Saldo saat ini: ${rewardPoint.currentPoints} point`,
      };
    }

    // Update points
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { increment: pointsToAdd },
        ...(pointsToAdd > 0
          ? { totalEarned: { increment: pointsToAdd } }
          : { totalSpent: { increment: Math.abs(pointsToAdd) } }),
        lastEarnedAt: pointsToAdd > 0 ? new Date() : rewardPoint.lastEarnedAt,
      },
    });

    // Record transaction
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);

    await prisma.rewardPointTransaction.create({
      data: {
        rewardPointId: updated.id,
        type: pointsToAdd > 0 ? 'EARNED' : 'SPENT',
        amount: pointsToAdd,
        source: 'ADMIN_ADJUSTMENT',
        description: reason || (pointsToAdd > 0 ? `Ditambahkan ${pointsToAdd} point oleh admin` : `Dikurangi ${Math.abs(pointsToAdd)} point oleh admin`),
        metadata: {
          reason,
          adminAction: true,
          ...(pointsToAdd > 0 ? { expirationDate: expirationDate.toISOString() } : {}),
        },
      },
    });

    return {
      success: true,
      newBalance: updated.currentPoints,
      message: pointsToAdd > 0
        ? `Berhasil menambahkan ${pointsToAdd} point`
        : `Berhasil mengurangi ${Math.abs(pointsToAdd)} point`,
    };
  }

  /**
   * Update tenant reward points (for super admin)
   * @param tenantId - Tenant ID
   * @param points - Points to add (can be negative)
   * @param reason - Reason for the update
   */
  async updateTenantPoints(
    tenantId: string,
    points: number,
    reason: string
  ): Promise<{ success: boolean; newBalance: number; message: string }> {
    // Ensure points is integer
    const pointsToAdd = Math.floor(points);
    
    if (pointsToAdd === 0) {
      return {
        success: false,
        newBalance: 0,
        message: 'Point harus lebih dari 0',
      };
    }

    const userId: string | null = null;

    // Get or create reward point record
    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    let rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    if (!rewardPoint) {
      rewardPoint = await prisma.rewardPoint.create({
        data: {
          tenantId,
          userId: userId || null,
          currentPoints: 0,
          totalEarned: 0,
        },
      });
    }

    // Check if deducting and balance is sufficient
    if (pointsToAdd < 0 && rewardPoint.currentPoints < Math.abs(pointsToAdd)) {
      return {
        success: false,
        newBalance: rewardPoint.currentPoints,
        message: `Point tidak cukup. Saldo saat ini: ${rewardPoint.currentPoints} point`,
      };
    }

    // Update points
    const updated = await prisma.rewardPoint.update({
      where: { id: rewardPoint.id },
      data: {
        currentPoints: { increment: pointsToAdd },
        ...(pointsToAdd > 0
          ? { totalEarned: { increment: pointsToAdd } }
          : { totalSpent: { increment: Math.abs(pointsToAdd) } }),
        lastEarnedAt: pointsToAdd > 0 ? new Date() : rewardPoint.lastEarnedAt,
      },
    });

    // Record transaction
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + POINT_CONFIG.EXPIRATION_DAYS);

    await prisma.rewardPointTransaction.create({
      data: {
        rewardPointId: updated.id,
        type: pointsToAdd > 0 ? 'EARNED' : 'SPENT',
        amount: pointsToAdd,
        source: 'ADMIN_ADJUSTMENT',
        description: reason || (pointsToAdd > 0 ? `Ditambahkan ${pointsToAdd} point oleh admin` : `Dikurangi ${Math.abs(pointsToAdd)} point oleh admin`),
        metadata: {
          reason,
          adminAction: true,
          ...(pointsToAdd > 0 ? { expirationDate: expirationDate.toISOString() } : {}),
        },
      },
    });

    return {
      success: true,
      newBalance: updated.currentPoints,
      message: pointsToAdd > 0
        ? `Berhasil menambahkan ${pointsToAdd} point`
        : `Berhasil mengurangi ${Math.abs(pointsToAdd)} point`,
    };
  }

  /**
   * Get tenant transactions (for super admin)
   * @param tenantId - Tenant ID
   * @param limit - Limit of transactions
   */
  async getTenantTransactions(tenantId: string, limit: number = 50) {
    const userId: string | null = null;

    // Use findFirst for nullable userId (Prisma doesn't support null in findUnique)
    const rewardPoint = await prisma.rewardPoint.findFirst({
      where: {
        tenantId,
        userId: userId || null,
      },
    });

    if (!rewardPoint) {
      return [];
    }

    const transactions = await prisma.rewardPointTransaction.findMany({
      where: {
        rewardPointId: rewardPoint.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  }
}

export default new RewardPointService();

