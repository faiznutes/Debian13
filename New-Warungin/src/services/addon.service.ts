import { PrismaClient } from '@prisma/client';
import prisma from '../config/database';

export interface SubscribeAddonInput {
  addonId: string;
  addonName: string;
  addonType: string;
  limit?: number;
  duration?: number; // days
}

export const AVAILABLE_ADDONS = [
  {
    id: 'add_outlets',
    name: 'Tambah Outlet',
    type: 'ADD_OUTLETS',
    description: 'Tambahkan outlet/cabang tambahan untuk operasi multi-lokasi',
    defaultLimit: 1,
    price: 120000, // per month
  },
  {
    id: 'add_users',
    name: 'Tambah Pengguna',
    type: 'ADD_USERS',
    description: 'Tambahkan user, kasir, atau supervisor tambahan dengan role preset (Admin, Kasir, Supervisor) dan log aktivitas',
    defaultLimit: 5,
    price: 50000, // per month (per 5 users)
  },
  {
    id: 'add_products',
    name: 'Tambah Produk',
    type: 'ADD_PRODUCTS',
    description: 'Tambahkan limit produk dengan fitur bulk import CSV/Excel dan dukungan varian produk (warna, ukuran, rasa)',
    defaultLimit: 100,
    price: 30000, // per month (per 100 produk)
  },
  {
    id: 'business_analytics',
    name: 'Business Analytics & Insight',
    type: 'BUSINESS_ANALYTICS',
    description: 'Laporan Laba Rugi dengan Revenue, COGS, Gross Profit, Operating Expenses, dan Net Profit. Prediksi penjualan, analisis tren, dan custom report builder. Ringkasan harian transaksi dan produk terlaris.',
    defaultLimit: null,
    price: 250000, // per month (gabungan dari 150k + 100k + 60k = 310k, diskon menjadi 250k)
  },
  {
    id: 'export_reports',
    name: 'Export Laporan',
    type: 'EXPORT_REPORTS',
    description: 'Ekspor laporan transaksi, stok, dan keuangan dalam format Excel, PDF, atau CSV. Rentang waktu custom sesuai kebutuhan. Tanda tangan digital untuk keperluan legal.',
    defaultLimit: null,
    price: 75000, // per month
  },
  {
    id: 'receipt_editor',
    name: 'Simple Nota Editor',
    type: 'RECEIPT_EDITOR',
    description: 'Kustomisasi tampilan nota: nama toko, pesan promo, logo. Preview real-time sebelum cetak untuk memastikan hasil. Edit header, footer, dan layout struk sesuai brand.',
    defaultLimit: null,
    price: 50000, // per month
  },
];

export class AddonService {
  async getAvailableAddons() {
    return AVAILABLE_ADDONS;
  }

  async getTenantAddons(tenantId: string) {
    const now = new Date();
    const addons = await prisma.tenantAddon.findMany({
      where: {
        tenantId,
        status: 'active',
        // Only include addons that are not expired
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { subscribedAt: 'desc' },
    });

    // Get current usage for each addon
    const addonsWithUsage = await Promise.all(
      addons.map(async (addon) => {
        let currentUsage = 0;
        
        switch (addon.addonType) {
          case 'ADD_USERS':
            currentUsage = await prisma.user.count({
              where: { tenantId, isActive: true },
            });
            break;
          case 'ADD_PRODUCTS':
            currentUsage = await prisma.product.count({
              where: { tenantId, isActive: true },
            });
            break;
          case 'ADD_OUTLETS':
            currentUsage = await prisma.outlet.count({
              where: { tenantId, isActive: true },
            });
            break;
          case 'BUSINESS_ANALYTICS':
          case 'EXPORT_REPORTS':
          case 'RECEIPT_EDITOR':
            // These addons don't have usage limits
            currentUsage = 0;
            break;
        }

        return {
          ...addon,
          currentUsage,
          isLimitReached: addon.limit ? currentUsage >= addon.limit : false,
        };
      })
    );

    return addonsWithUsage;
  }

  async subscribeAddon(tenantId: string, data: SubscribeAddonInput) {
    // Get tenant subscription info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionEnd: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if addon already exists
    const existing = await prisma.tenantAddon.findUnique({
      where: {
        tenantId_addonId: {
          tenantId,
          addonId: data.addonId,
        },
      },
    });

    // Check if addon has limit (can be purchased multiple times)
    const addonInfo = AVAILABLE_ADDONS.find(a => a.id === data.addonId);
    const hasLimit = addonInfo?.defaultLimit !== null && addonInfo?.defaultLimit !== undefined;

    // For addons without limit (BUSINESS_ANALYTICS, EXPORT_REPORTS, RECEIPT_EDITOR)
    // Only throw error if already active and not expired
    if (!hasLimit && existing && existing.status === 'active') {
      const now = new Date();
      if (existing.expiresAt) {
        const expiresAt = new Date(existing.expiresAt);
        if (expiresAt > now) {
          throw new Error('Addon already subscribed');
        }
      } else {
        throw new Error('Addon already subscribed');
      }
    }
    // For addons with limit (ADD_OUTLETS, ADD_USERS, ADD_PRODUCTS), allow multiple purchases

    const now = new Date();
    // Calculate addon expiry: flat duration from now (can exceed subscription end)
    let expiresAt: Date | null = null;
    
    if (data.duration) {
      // Add flat duration from now, regardless of subscription end date
      expiresAt = new Date(now.getTime() + data.duration * 24 * 60 * 60 * 1000);
    } else if (tenant.subscriptionEnd) {
      // If no duration specified, use subscription end date
      expiresAt = tenant.subscriptionEnd;
    }

    // Store original duration in config for future reference
    const addonConfig = {
      originalDuration: data.duration || null, // Store original duration in days
    };

    if (existing) {
      // Update existing addon
      // If subscribedAt is not set, set it to now for global report tracking
      const updateData: any = {
        status: 'active',
        expiresAt,
        limit: data.limit,
        config: addonConfig,
      };
      
      // Only update subscribedAt if it's not already set
      if (!existing.subscribedAt) {
        updateData.subscribedAt = now;
      }
      
      const updatedAddon = await prisma.tenantAddon.update({
        where: { id: existing.id },
        data: updateData,
      });
      
      // Award points from addon purchase (10rb = 5 point) if extending/renewing
      // Calculate amount based on addon price and duration
      if (addonInfo && addonInfo.price && data.duration) {
        const amount = Math.floor((addonInfo.price * data.duration) / 30); // Calculate based on duration
        
        if (amount > 0) {
          try {
            const rewardPointService = (await import('./reward-point.service')).default;
            await rewardPointService.awardPointsFromAddon(
              tenantId,
              amount,
              data.addonName,
              data.addonType
            );
          } catch (error: any) {
            // Log error but don't fail the addon subscription
            console.error('Error awarding points from addon:', error);
          }
        }
      }
      
      return updatedAddon;
    }

    // Create new addon subscription
    // Set subscribedAt to now for global report tracking
    const addon = await prisma.tenantAddon.create({
      data: {
        tenantId,
        addonId: data.addonId,
        addonName: data.addonName,
        addonType: data.addonType,
        limit: data.limit,
        status: 'active',
        subscribedAt: now, // Set subscribedAt untuk laporan global
        expiresAt,
        config: addonConfig,
      },
    });
    
    // Log addon creation for debugging
    console.log(`✅ Addon subscribed for tenant ${tenantId}:`, {
      addonId: addon.id,
      addonName: data.addonName,
      subscribedAt: now.toISOString(),
      expiresAt: expiresAt?.toISOString(),
    });
    
    // Award points from addon purchase (10rb = 5 point)
    // Calculate amount based on addon price and duration
    if (addonInfo && addonInfo.price) {
      const durationDays = data.duration || (tenant.subscriptionEnd ? Math.ceil((tenant.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 30);
      const amount = Math.floor((addonInfo.price * durationDays) / 30); // Calculate based on duration
      
      if (amount > 0) {
        try {
          const rewardPointService = (await import('./reward-point.service')).default;
          await rewardPointService.awardPointsFromAddon(
            tenantId,
            amount,
            data.addonName,
            data.addonType
          );
        } catch (error: any) {
          // Log error but don't fail the addon subscription
          console.error('Error awarding points from addon:', error);
        }
      }
    }
    
    return addon;
  }

  /**
   * Extend addon subscription
   * Logic: Addon expiry cannot exceed subscription expiry
   * If subscription is extended, addon can be extended up to the original addon duration
   */
  async extendAddon(tenantId: string, addonId: string, duration: number) {
    // Get tenant and addon
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionEnd: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const addon = await prisma.tenantAddon.findUnique({
      where: {
        tenantId_addonId: {
          tenantId,
          addonId,
        },
      },
    });

    if (!addon) {
      throw new Error('Addon not found');
    }

    const now = new Date();
    const currentExpiry = addon.expiresAt ? new Date(addon.expiresAt) : now;
    // Add flat duration from current expiry (can exceed subscription end)
    const newExpiry = new Date(currentExpiry.getTime() + duration * 24 * 60 * 60 * 1000);

    // Update config with new original duration (duration from current expiry to new expiry)
    const currentConfig = (addon.config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      originalDuration: duration, // Update to the new duration being added
    };

    return prisma.tenantAddon.update({
      where: { id: addon.id },
      data: {
        expiresAt: newExpiry,
        config: updatedConfig,
      },
    });
  }

  /**
   * Reduce addon subscription duration
   * Logic: Reduce addon expiry by specified duration
   */
  async reduceAddon(tenantId: string, addonId: string, duration: number) {
    // Get tenant and addon
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionEnd: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const addon = await prisma.tenantAddon.findUnique({
      where: {
        tenantId_addonId: {
          tenantId,
          addonId,
        },
      },
    });

    if (!addon) {
      throw new Error('Addon not found');
    }

    if (!addon.expiresAt) {
      throw new Error('Addon has no expiry date to reduce');
    }

    const now = new Date();
    const currentExpiry = new Date(addon.expiresAt);
    
    // Calculate new expiry (reduce by duration)
    const newExpiry = new Date(currentExpiry.getTime() - duration * 24 * 60 * 60 * 1000);
    
    // Ensure new expiry is not before now
    if (newExpiry < now) {
      throw new Error('Cannot reduce addon to a date in the past');
    }

    // Addon expiry can exceed subscription expiry (flat duration)
    return prisma.tenantAddon.update({
      where: { id: addon.id },
      data: {
        expiresAt: newExpiry,
      },
    });
  }

  async unsubscribeAddon(tenantId: string, addonId: string) {
    const addon = await prisma.tenantAddon.findUnique({
      where: {
        tenantId_addonId: {
          tenantId,
          addonId,
        },
      },
    });

    if (!addon) {
      throw new Error('Addon not found');
    }

    return prisma.tenantAddon.update({
      where: { id: addon.id },
      data: { status: 'inactive' },
    });
  }

  async checkLimit(tenantId: string, addonType: string): Promise<{ allowed: boolean; currentUsage: number; limit?: number }> {
    // Map addon type to plan limit type
    let limitType: 'products' | 'users' | 'outlets' | null = null;
    switch (addonType) {
      case 'ADD_USERS':
        limitType = 'users';
        break;
      case 'ADD_PRODUCTS':
        limitType = 'products';
        break;
      case 'ADD_OUTLETS':
        limitType = 'outlets';
        break;
      case 'BUSINESS_ANALYTICS':
      case 'EXPORT_REPORTS':
      case 'RECEIPT_EDITOR':
        // These addons don't have usage limits
        return { allowed: true, currentUsage: 0 };
    }

    if (!limitType) {
      return { allowed: true, currentUsage: 0 };
    }

    // Use plan-features service to check total limit (base plan + addons)
    const planFeaturesService = (await import('./plan-features.service')).default;
    const limitCheck = await planFeaturesService.checkPlanLimit(tenantId, limitType);

    return {
      allowed: limitCheck.allowed,
      currentUsage: limitCheck.currentUsage,
      limit: limitCheck.limit === -1 ? undefined : limitCheck.limit,
    };
  }
}

export default new AddonService();

