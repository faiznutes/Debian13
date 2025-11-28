import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export interface CreateOutletInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateOutletInput {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export class OutletService {
  async getOutlets(tenantId: string) {
    const outlets = await prisma.outlet.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return outlets;
  }

  async getOutlet(tenantId: string, outletId: string) {
    const outlet = await prisma.outlet.findFirst({
      where: {
        id: outletId,
        tenantId,
      },
    });
    if (!outlet) {
      throw new Error('Outlet tidak ditemukan');
    }
    return outlet;
  }

  async createOutlet(tenantId: string, data: CreateOutletInput) {
    // Check outlet limit based on subscription plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        addons: {
          where: {
            status: 'active',
            OR: [
              { expiresAt: { gt: new Date() } },
              { expiresAt: null },
            ],
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan');
    }

    // Get current active outlets count
    const activeOutletsCount = await prisma.outlet.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    // Get outlet limit from plan features
    const { getTenantPlanFeatures } = await import('./plan-features.service');
    const features = await getTenantPlanFeatures(tenantId);
    
    const outletLimit = features.limits.outlets;
    
    // Check if limit is reached (unlimited = -1)
    if (outletLimit !== -1 && activeOutletsCount >= outletLimit) {
      throw new Error(`Batas outlet telah tercapai. Limit: ${outletLimit}`);
    }

    const outlet = await prisma.outlet.create({
      data: {
        tenantId,
        ...data,
      },
    });

    // Invalidate analytics cache after outlet creation
    await this.invalidateAnalyticsCache(tenantId);

    return outlet;
  }

  async updateOutlet(tenantId: string, outletId: string, data: UpdateOutletInput) {
    const outlet = await this.getOutlet(tenantId, outletId);
    
    const updated = await prisma.outlet.update({
      where: { id: outletId },
      data,
    });

    // Invalidate analytics cache after outlet update
    await this.invalidateAnalyticsCache(tenantId);

    return updated;
  }

  async deleteOutlet(tenantId: string, outletId: string) {
    const outlet = await this.getOutlet(tenantId, outletId);
    
    // Check if outlet has orders
    const orderCount = await prisma.order.count({
      where: { outletId },
    });
    
    let result;
    if (orderCount > 0) {
      // Soft delete: set isActive to false
      result = await prisma.outlet.update({
        where: { id: outletId },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no orders
      result = await prisma.outlet.delete({
        where: { id: outletId },
      });
    }

    // Invalidate analytics cache after outlet deletion
    await this.invalidateAnalyticsCache(tenantId);

    return result;
  }

  /**
   * Invalidate analytics cache for a tenant
   */
  private async invalidateAnalyticsCache(tenantId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (redis) {
        // Delete all analytics cache keys for this tenant
        const keys = await redis.keys(`analytics:*:${tenantId}`);
        const keys2 = await redis.keys(`analytics:${tenantId}:*`);
        const allKeys = [...keys, ...keys2];
        if (allKeys.length > 0) {
          await redis.del(...allKeys);
          logger.info('Invalidated analytics cache after outlet operation', {
            tenantId,
            cacheKeysDeleted: allKeys.length
          });
        }
      }
    } catch (error: any) {
      logger.warn('Failed to invalidate analytics cache', {
        error: error.message,
        tenantId
      });
    }
  }
}

export default new OutletService();

