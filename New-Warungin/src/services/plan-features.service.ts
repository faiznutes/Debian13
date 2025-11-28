import prisma from '../config/database';
import addonService from './addon.service';

/**
 * Plan base limits (without addons)
 * Sesuai dengan struktur yang diminta
 */
const PLAN_FEATURES: Record<string, {
  tenantsLimit: number;
  products: number;
  users: number;
  outlets: number;
  addons: string[];
  access: string[];
}> = {
  BASIC: {
    tenantsLimit: 1,
    products: 25,
    users: 4, // 1 admin + 2 kasir + 1 kitchen
    outlets: 1,
    addons: ['receipt-basic'],
    access: ['kasir', 'laporan'],
  },
  PRO: {
    tenantsLimit: 1, // 1 tenant
    products: 100, // 100 produk
    users: 10, // 1 admin + 1 supervisor + 6 kasir + 2 kitchen = 10 total
    outlets: 2, // 2 outlet
    addons: ['receipt-advanced', 'multi-outlet'],
    access: ['kasir', 'laporan', 'manajemen-stok', 'addon-management'],
  },
  ENTERPRISE: {
    tenantsLimit: -1, // Unlimited (custom)
    products: -1, // Unlimited (custom)
    users: -1, // Unlimited (custom)
    outlets: -1, // Unlimited (custom)
    addons: ['receipt-advanced', 'multi-outlet', 'ecommerce-integration'],
    access: ['semua'],
  },
};

// Alias untuk backward compatibility
const PLAN_BASE_LIMITS: Record<string, {
  products: number;
  users: number;
  outlets: number;
  features: string[];
}> = {
  BASIC: {
    products: PLAN_FEATURES.BASIC.products,
    users: PLAN_FEATURES.BASIC.users,
    outlets: PLAN_FEATURES.BASIC.outlets,
    features: PLAN_FEATURES.BASIC.access,
  },
  PRO: {
    products: PLAN_FEATURES.PRO.products,
    users: PLAN_FEATURES.PRO.users,
    outlets: PLAN_FEATURES.PRO.outlets,
    features: PLAN_FEATURES.PRO.access,
  },
  ENTERPRISE: {
    products: PLAN_FEATURES.ENTERPRISE.products,
    users: PLAN_FEATURES.ENTERPRISE.users,
    outlets: PLAN_FEATURES.ENTERPRISE.outlets,
    features: PLAN_FEATURES.ENTERPRISE.access,
  },
};

/**
 * Apply plan features to tenant
 * Update features, tenantsLimit, dan semua limit terkait
 */
export async function applyPlanFeatures(tenantId: string, planName: string) {
  const plan = (planName || 'BASIC').toUpperCase() as 'BASIC' | 'PRO' | 'ENTERPRISE';
  const planConfig = PLAN_FEATURES[plan] || PLAN_FEATURES.BASIC;

  // Get current tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        where: { isActive: true },
      },
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Update tenant with new plan features
  const updatedTenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tenantsLimit: planConfig.tenantsLimit,
      features: planConfig as any, // Store full plan config as JSON
    },
  });

  // Auto-disable users that exceed the limit
  // Priority: ADMIN_TENANT always stays active, then CASHIER, then KITCHEN, then SUPERVISOR
  if (planConfig.users !== -1) {
    const activeUsers = tenant.users;
    if (activeUsers.length > planConfig.users) {
      // Separate users by role for priority-based disabling
      const adminUsers = activeUsers.filter(u => u.role === 'ADMIN_TENANT');
      const cashierUsers = activeUsers.filter(u => u.role === 'CASHIER');
      const kitchenUsers = activeUsers.filter(u => u.role === 'KITCHEN');
      const supervisorUsers = activeUsers.filter(u => u.role === 'SUPERVISOR');
      
      // Sort each group by creation date (oldest first)
      adminUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      cashierUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      kitchenUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      supervisorUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      // Calculate how many users we can keep
      let remainingSlots = planConfig.users;
      const usersToKeep: typeof activeUsers = [];
      const usersToDisable: typeof activeUsers = [];
      
      // Keep all ADMIN_TENANT (always)
      usersToKeep.push(...adminUsers);
      remainingSlots -= adminUsers.length;
      
      // Keep CASHIER users (priority after admin)
      if (remainingSlots > 0) {
        const cashierToKeep = cashierUsers.slice(0, Math.min(remainingSlots, cashierUsers.length));
        usersToKeep.push(...cashierToKeep);
        remainingSlots -= cashierToKeep.length;
        usersToDisable.push(...cashierUsers.slice(cashierToKeep.length));
      } else {
        usersToDisable.push(...cashierUsers);
      }
      
      // Keep KITCHEN users
      if (remainingSlots > 0) {
        const kitchenToKeep = kitchenUsers.slice(0, Math.min(remainingSlots, kitchenUsers.length));
        usersToKeep.push(...kitchenToKeep);
        remainingSlots -= kitchenToKeep.length;
        usersToDisable.push(...kitchenUsers.slice(kitchenToKeep.length));
      } else {
        usersToDisable.push(...kitchenUsers);
      }
      
      // Keep SUPERVISOR users (lowest priority)
      if (remainingSlots > 0) {
        const supervisorToKeep = supervisorUsers.slice(0, Math.min(remainingSlots, supervisorUsers.length));
        usersToKeep.push(...supervisorToKeep);
        usersToDisable.push(...supervisorUsers.slice(supervisorToKeep.length));
      } else {
        usersToDisable.push(...supervisorUsers);
      }
      
      // Disable users that exceed limit
      for (const user of usersToDisable) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
        });
      }
    }
  }

  // Auto-disable outlets that exceed the limit
  if (planConfig.outlets !== -1) {
    const activeOutlets = await prisma.outlet.findMany({
      where: { tenantId, isActive: true },
    });

    if (activeOutlets.length > planConfig.outlets) {
      const sortedOutlets = activeOutlets.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      const outletsToDisable = sortedOutlets.slice(planConfig.outlets);
      for (const outlet of outletsToDisable) {
        await prisma.outlet.update({
          where: { id: outlet.id },
          data: { isActive: false },
        });
      }
    }
  }

  // Auto-disable products that exceed the limit
  if (planConfig.products !== -1) {
    const activeProducts = await prisma.product.findMany({
      where: { tenantId, isActive: true },
    });

    if (activeProducts.length > planConfig.products) {
      // Sort by creation date, keep oldest products active
      const sortedProducts = activeProducts.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      // Disable products that exceed limit
      const productsToDisable = sortedProducts.slice(planConfig.products);
      for (const product of productsToDisable) {
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false },
        });
      }
    }
  }

  // Update tenantsActive count
  const activeUsersCount = await prisma.user.count({
    where: { tenantId, isActive: true },
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tenantsActive: activeUsersCount,
    },
  });

  return {
    plan,
    features: planConfig,
    tenantsLimit: planConfig.tenantsLimit,
    tenantsActive: activeUsersCount,
  };
}

/**
 * Get tenant plan features and limits
 * Combines base plan limits with active addons
 */
export async function getTenantPlanFeatures(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionPlan: true,
      tenantsLimit: true,
      tenantsActive: true,
      features: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const plan = (tenant.subscriptionPlan || 'BASIC') as 'BASIC' | 'PRO' | 'ENTERPRISE';
  const baseLimits = PLAN_BASE_LIMITS[plan] || PLAN_BASE_LIMITS.BASIC;

  // Get active addons
  const activeAddons = await addonService.getTenantAddons(tenantId);

  // Calculate total limits (base + addons)
  let totalProducts = baseLimits.products === -1 ? -1 : baseLimits.products;
  let totalUsers = baseLimits.users === -1 ? -1 : baseLimits.users;
  let totalOutlets = baseLimits.outlets === -1 ? -1 : baseLimits.outlets;
  let totalTenants = tenant.tenantsLimit || PLAN_FEATURES[plan]?.tenantsLimit || 1;
  if (totalTenants === -1) totalTenants = -1; // Keep unlimited
  const features = [...baseLimits.features];

  // Add addon limits
  for (const addon of activeAddons) {
    switch (addon.addonType) {
      case 'ADD_PRODUCTS':
        if (totalProducts !== -1 && addon.limit) {
          totalProducts += addon.limit;
        }
        break;
      case 'ADD_USERS':
        if (totalUsers !== -1 && addon.limit) {
          totalUsers += addon.limit;
        }
        break;
      case 'ADD_OUTLETS':
        if (totalOutlets !== -1 && addon.limit) {
          totalOutlets += addon.limit;
        }
        break;
      case 'BUSINESS_ANALYTICS':
        if (!features.includes('Business Analytics & Insight')) {
          features.push('Business Analytics & Insight');
          features.push('Laporan Laba Rugi');
          features.push('Advanced Analytics');
          features.push('Quick Insight');
        }
        break;
      case 'EXPORT_REPORTS':
        if (!features.includes('Export Laporan')) {
          features.push('Export Laporan');
        }
        break;
      case 'RECEIPT_EDITOR':
        if (!features.includes('Simple Nota Editor')) {
          features.push('Simple Nota Editor');
        }
        break;
    }
  }

  return {
    plan,
    limits: {
      products: totalProducts,
      users: totalUsers,
      outlets: totalOutlets,
    },
    features,
    baseLimits,
    tenantsLimit: tenant.tenantsLimit || PLAN_FEATURES[plan]?.tenantsLimit || 1,
    tenantsActive: tenant.tenantsActive || 0,
    activeAddons: activeAddons.map(a => ({
      id: a.addonId,
      type: a.addonType,
      name: a.addonName,
      limit: a.limit,
    })),
  };
}

/**
 * Check if tenant can perform an action based on plan limits
 */
export async function checkPlanLimit(
  tenantId: string,
  limitType: 'products' | 'users' | 'outlets'
): Promise<{ allowed: boolean; currentUsage: number; limit: number; message?: string }> {
  
  const planFeatures = await getTenantPlanFeatures(tenantId);
  const limit = planFeatures.limits[limitType];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, currentUsage: 0, limit: -1 };
  }

  // Get current usage
  let currentUsage = 0;
  switch (limitType) {
    case 'products':
      currentUsage = await prisma.product.count({
        where: { tenantId, isActive: true },
      });
      break;
    case 'users':
      currentUsage = await prisma.user.count({
        where: { tenantId, isActive: true },
      });
      break;
    case 'outlets':
      currentUsage = await prisma.outlet.count({
        where: { tenantId, isActive: true },
      });
      break;
  }

  const allowed = currentUsage < limit;
  const message = !allowed
    ? `Limit ${limitType} tercapai (${currentUsage}/${limit}). Upgrade paket atau beli addon untuk menambah limit.`
    : undefined;

  return {
    allowed,
    currentUsage,
    limit,
    message,
  };
}

/**
 * Check if tenant has access to a feature
 */
export async function checkPlanFeature(
  tenantId: string,
  feature: string
): Promise<boolean> {
  
  const planFeatures = await getTenantPlanFeatures(tenantId);
  return planFeatures.features.includes(feature);
}

// Export PLAN_FEATURES for use in other services
export { PLAN_FEATURES, PLAN_BASE_LIMITS };

export default {
  getTenantPlanFeatures,
  checkPlanLimit,
  checkPlanFeature,
  applyPlanFeatures,
  PLAN_FEATURES,
};
