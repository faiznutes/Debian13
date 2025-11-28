import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import prisma from '../config/database';
import addonService from './addon.service';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN_TENANT' | 'SUPERVISOR' | 'CASHIER' | 'KITCHEN';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN_TENANT' | 'SUPERVISOR' | 'CASHIER' | 'KITCHEN';
  isActive?: boolean;
  permissions?: {
    canEditOrders?: boolean;
    canDeleteOrders?: boolean;
    canCancelOrders?: boolean;
    canRefundOrders?: boolean;
    canViewReports?: boolean;
    canEditReports?: boolean;
    canExportReports?: boolean;
    canManageProducts?: boolean;
    canManageCustomers?: boolean;
    allowedStoreIds?: string[]; // Array of store IDs that supervisor can access
    assignedStoreId?: string; // Single store ID assigned to cashier/kitchen
  };
}

export class UserService {
  async getUsers(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          permissions: true,
          defaultPassword: true, // Include default password for Super Admin
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        defaultPassword: true, // Include default password for Super Admin
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  async createUser(data: CreateUserInput, tenantId: string) {
    // Check limit for ADD_USERS addon
    // Use plan-features service to check total limit (base plan + addons)
    const planFeaturesService = (await import('./plan-features.service')).default;
    const limitCheck = await planFeaturesService.checkPlanLimit(tenantId, 'users');
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message || `User limit reached (${limitCheck.currentUsage}/${limitCheck.limit}). Upgrade your plan or addon to add more users.`);
    }

    // Generate password if not provided
    const password = data.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: data.email,
        },
      },
    });

    if (existing) {
      throw new Error('User with this email already exists');
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        defaultPassword: password, // Store default password (plaintext) for Super Admin to view
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        defaultPassword: true,
      },
    });

    // Invalidate analytics cache after user creation (if needed)
    // Note: Users don't directly affect analytics, but we invalidate for consistency
    await this.invalidateAnalyticsCache(tenantId);

    return { ...user, password: data.password ? undefined : password };
  }

  async updateUser(id: string, data: UpdateUserInput, tenantId: string, userRole?: string) {
    const user = await this.getUserById(id, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    
    // Allow isActive update based on role and subscription status
    // ADMIN_TENANT can activate/deactivate users if subscription is active
    // ADMIN_TENANT cannot activate users if subscription is expired or null
    // SUPER_ADMIN can always activate/deactivate users
    if (data.isActive !== undefined) {
      if (userRole === 'ADMIN_TENANT' && data.isActive === true) {
        // Check subscription status - this should already be checked in route
        // But we keep this as a safety check
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            subscriptionEnd: true,
          },
        });

        if (tenant) {
          const now = new Date();
          const subscriptionEnd = tenant.subscriptionEnd;

          // Block ADMIN_TENANT from activating users if subscription is expired or null
          if (!subscriptionEnd || subscriptionEnd < now) {
            throw new Error('Tidak dapat mengaktifkan user. Langganan telah kedaluwarsa atau belum diaktifkan. Silakan perpanjang langganan terlebih dahulu.');
          }
        }
      }
      updateData.isActive = data.isActive;
    }
    
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
      updateData.defaultPassword = data.password; // Store new password (plaintext) for Super Admin to view
    }
    if (data.permissions !== undefined) {
      updateData.permissions = data.permissions;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        defaultPassword: true, // Include default password for Super Admin
      },
    });

    // Invalidate analytics cache after user update (if needed)
    await this.invalidateAnalyticsCache(tenantId);

    return updatedUser;
  }

  /**
   * Bulk update user status (activate/deactivate)
   */
  async bulkUpdateUserStatus(
    tenantId: string,
    userIds: string[],
    isActive: boolean
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        const user = await this.getUserById(userId, tenantId);
        if (!user) {
          failed++;
          errors.push(`User ${userId} not found`);
          continue;
        }

        // Update user status
        await this.updateUser(userId, { isActive }, tenantId, 'SUPER_ADMIN');
        updated++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to update user ${userId}: ${error.message}`);
      }
    }

    return { updated, failed, errors };
  }

  async deleteUser(id: string, tenantId: string) {
    const user = await this.getUserById(id, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.delete({
      where: { id },
    });

    // Invalidate analytics cache after user deletion (if needed)
    await this.invalidateAnalyticsCache(tenantId);
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
          logger.info('Invalidated analytics cache after user operation', {
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

  async resetPassword(id: string, tenantId: string) {
    const user = await this.getUserById(id, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new password
    const randomPart = Math.random().toString(36).slice(-8);
    const upperPart = Math.random().toString(36).slice(-4).toUpperCase();
    const newPassword = `${randomPart}${upperPart}123`;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and default password
    await prisma.user.update({
      where: { id },
      data: { 
        password: hashedPassword,
        defaultPassword: newPassword, // Store new password (plaintext) for Super Admin to view
      },
    });

    // Return new password (plaintext) for display
    return { password: newPassword };
  }

  async getPassword(id: string, tenantId: string) {
    const user = await this.getUserById(id, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return default password if available
    if (user.defaultPassword) {
      return { password: user.defaultPassword };
    }

    // If no default password, reset it and return new password
    return this.resetPassword(id, tenantId);
  }
}

export default new UserService();

