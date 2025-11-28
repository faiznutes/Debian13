import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import logger from '../utils/logger';
import { getRedisClient } from '../config/redis';

export interface CreateTenantInput {
  name: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string; // BASIC, PRO, ENTERPRISE
}

// Generate email from tenant name
// Example: "Nasi Padang Barokah" -> "PadangBarokah@warungin.com"
function generateEmailFromName(name: string): string {
  if (!name || name.trim().length === 0) {
    throw new AppError('Nama tenant tidak boleh kosong', 400);
  }
  
  // Remove common words like "Nasi", "Warung", "Restoran", etc.
  const words = name
    .trim()
    .split(/\s+/)
    .filter(word => {
      const lower = word.toLowerCase().trim();
      return lower.length > 0 && !['nasi', 'warung', 'restoran', 'rumah', 'makan', 'kedai', 'toko', 'cafe', 'café'].includes(lower);
    })
    .map(word => {
      const trimmed = word.trim();
      if (trimmed.length === 0) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .filter(word => word.length > 0);
  
  // If no words left, use the first word
  if (words.length === 0) {
    const firstWord = name.trim().split(/\s+/)[0];
    if (firstWord && firstWord.length > 0) {
      words.push(firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase());
    } else {
      // Fallback: use first 10 characters of name
      const fallback = name.trim().substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
      if (fallback.length === 0) {
        throw new AppError('Nama tenant tidak valid', 400);
      }
      words.push(fallback.charAt(0).toUpperCase() + fallback.slice(1).toLowerCase());
    }
  }
  
  // Join words and remove spaces and special characters
  let emailPrefix = words.join('').replace(/[^a-zA-Z0-9]/g, '');
  
  // Ensure email prefix is not empty
  if (emailPrefix.length === 0) {
    emailPrefix = 'Tenant' + Date.now().toString().slice(-6);
  }
  
  // Limit email prefix length to 50 characters
  if (emailPrefix.length > 50) {
    emailPrefix = emailPrefix.substring(0, 50);
  }
  
  return `${emailPrefix}@warungin.com`;
}

export const createTenant = async (input: CreateTenantInput) => {
  try {
    const { name, phone, address, subscriptionPlan = 'BASIC' } = input;

    // Validate input
    if (!name || name.trim().length < 3) {
      throw new AppError('Nama tenant minimal 3 karakter', 400);
    }

    // Generate email from name
    let email = generateEmailFromName(name);

    // Check if tenant email exists
    let existingTenant = await prisma.tenant.findUnique({
      where: { email },
    });

    if (existingTenant) {
      // If email exists, add a number
      let counter = 1;
      let newEmail = email.replace('@warungin.com', `${counter}@warungin.com`);
      while (await prisma.tenant.findUnique({ where: { email: newEmail } })) {
        counter++;
        newEmail = email.replace('@warungin.com', `${counter}@warungin.com`);
        // Prevent infinite loop
        if (counter > 1000) {
          throw new AppError('Terlalu banyak tenant dengan nama serupa. Silakan gunakan nama yang lebih unik.', 400);
        }
      }
      email = newEmail;
    }

  // Generate slug from email
  const slug = email.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Set subscription dates (30 days from now)
  const subscriptionStart = new Date();
  const subscriptionEnd = new Date();
  subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

  // Generate default password (random + uppercase + numbers)
  const randomPart = Math.random().toString(36).slice(-8);
  const upperPart = Math.random().toString(36).slice(-4).toUpperCase();
  const defaultPassword = `${randomPart}${upperPart}123`;

  // Create tenant and users in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name,
        email,
        phone,
        address,
        slug,
        subscriptionPlan,
        subscriptionStart,
        subscriptionEnd,
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Generate users based on plan
    // BASIC: 1 ADMIN_TENANT, 2 CASHIER, 1 KITCHEN (total 4 users)
    // PRO: 1 ADMIN_TENANT, 1 SUPERVISOR, 6 CASHIER, 2 KITCHEN (total 10 users)
    // ENTERPRISE: 1 ADMIN_TENANT, 1 SUPERVISOR, 10 CASHIER, 3 KITCHEN (total 15 users, unlimited can add more)
    const usersToCreate: Array<{
      tenantId: string;
      email: string;
      password: string;
      name: string;
      role: 'ADMIN_TENANT' | 'CASHIER' | 'KITCHEN' | 'SUPERVISOR';
    }> = [];

    // Generate email prefix from tenant name
    const emailPrefix = email.split('@')[0]; // e.g., "PadangBarokah"
    
    // Always create admin
    usersToCreate.push({
      tenantId: tenant.id,
      email: `${emailPrefix}@warungin.com`, // Admin uses tenant email
      password: hashedPassword,
      name: `${name} Admin`,
      role: 'ADMIN_TENANT' as const,
    });

    if (subscriptionPlan === 'BASIC') {
      // BASIC: 1 admin, 2 kasir, 1 dapur = 4 users
      usersToCreate.push(
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K1@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 1`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K2@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 2`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D1@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur`,
          role: 'KITCHEN' as const,
        }
      );
    } else if (subscriptionPlan === 'PRO') {
      // PRO: 1 admin, 1 supervisor, 6 kasir, 2 dapur = 10 users
      usersToCreate.push(
        {
          tenantId: tenant.id,
          email: `${emailPrefix}S1@warungin.com`,
          password: hashedPassword,
          name: `${name} Supervisor`,
          role: 'SUPERVISOR' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K1@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 1`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K2@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 2`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K3@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 3`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K4@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 4`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K5@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 5`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K6@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 6`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D1@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur 1`,
          role: 'KITCHEN' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D2@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur 2`,
          role: 'KITCHEN' as const,
        }
      );
    } else if (subscriptionPlan === 'ENTERPRISE') {
      // ENTERPRISE: 1 admin, 1 supervisor, 10 kasir, 3 dapur = 15 users (default set, user can add more)
      usersToCreate.push(
        {
          tenantId: tenant.id,
          email: `${emailPrefix}S1@warungin.com`,
          password: hashedPassword,
          name: `${name} Supervisor`,
          role: 'SUPERVISOR' as const,
        },
        // Create 10 cashiers for ENTERPRISE plan
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K1@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 1`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K2@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 2`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K3@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 3`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K4@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 4`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K5@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 5`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K6@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 6`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K7@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 7`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K8@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 8`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K9@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 9`,
          role: 'CASHIER' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}K10@warungin.com`,
          password: hashedPassword,
          name: `${name} Kasir 10`,
          role: 'CASHIER' as const,
        },
        // Create 3 kitchen users for ENTERPRISE plan
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D1@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur 1`,
          role: 'KITCHEN' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D2@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur 2`,
          role: 'KITCHEN' as const,
        },
        {
          tenantId: tenant.id,
          email: `${emailPrefix}D3@warungin.com`,
          password: hashedPassword,
          name: `${name} Dapur 3`,
          role: 'KITCHEN' as const,
        }
      );
    }

    const users = await Promise.all(
      usersToCreate.map((userData) =>
        tx.user.create({
          data: {
            ...userData,
            defaultPassword: defaultPassword, // Store default password (plaintext) for Super Admin to view
          },
        })
      )
    );

    // Create default receipt template
    await tx.receiptTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Default Receipt',
        templateType: 'DEFAULT',
        isDefault: true,
        paperSize: 'A4',
      },
    });

    // Get plan price
    const planPrices: Record<string, number> = {
      BASIC: 200000,
      PRO: 350000,
      ENTERPRISE: 500000,
    };
    const planPrice = planPrices[subscriptionPlan] || 0;

    // Create subscription record with plan price
    // Convert amount to string for Prisma Decimal compatibility
    // This subscription will be recorded as a purchase in global reports
    const subscription = await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: subscriptionPlan,
        startDate: subscriptionStart,
        endDate: subscriptionEnd,
        status: 'ACTIVE',
        amount: planPrice.toString(), // Set amount sesuai harga paket untuk laporan global
      },
    });
    
    // Auto activate users when subscription is active
    await tx.user.updateMany({
      where: {
        tenantId: tenant.id,
        role: {
          in: ['CASHIER', 'KITCHEN', 'SUPERVISOR'],
        },
      },
      data: {
        isActive: true,
      },
    });
    
    // Log subscription creation for debugging
    console.log(`✅ Subscription created for tenant ${tenant.name}:`, {
      subscriptionId: subscription.id,
      plan: subscriptionPlan,
      amount: planPrice,
      startDate: subscriptionStart.toISOString(),
      endDate: subscriptionEnd.toISOString(),
    });

    // Update tenant with plan features (inside transaction)
    const planConfig = subscriptionPlan === 'BASIC' ? {
      tenantsLimit: 1,
      products: 25,
      users: 4,
      outlets: 1,
      addons: ['receipt-basic'],
      access: ['kasir', 'laporan'],
    } : subscriptionPlan === 'PRO' ? {
      tenantsLimit: 1,
      products: 100,
      users: 10,
      outlets: 2,
      addons: ['receipt-advanced', 'multi-outlet'],
      access: ['kasir', 'laporan', 'manajemen-stok', 'addon-management'],
    } : {
      tenantsLimit: -1,
      products: -1,
      users: -1,
      outlets: -1,
      addons: ['receipt-advanced', 'multi-outlet', 'ecommerce-integration'],
      access: ['semua'],
    };
    
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        tenantsLimit: planConfig.tenantsLimit,
        features: planConfig as any,
      },
    });

    return { tenant, users, defaultPassword };
  });

  // Invalidate cache for tenants list and individual tenant
  try {
    const redis = getRedisClient();
    if (redis) {
      // Delete individual tenant cache
      await redis.del(`tenant:${result.tenant.id}`);
      
      // Delete all tenants list cache (tenants:*)
      const keys = await redis.keys('tenants:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Invalidated tenants list cache after creating tenant', {
          tenantId: result.tenant.id,
          cacheKeysDeleted: keys.length
        });
      }
    }
  } catch (cacheError: any) {
    // Log but don't fail tenant creation if cache invalidation fails
    logger.warn('Failed to invalidate cache after creating tenant', {
      error: cacheError.message,
      tenantId: result.tenant.id
    });
  }

  // Apply plan features after transaction completes (to avoid transaction conflicts)
  // This is done asynchronously to not block the response
  // Use process.nextTick to ensure it runs after the response is sent
  process.nextTick(async () => {
    try {
      const { applyPlanFeatures } = await import('./plan-features.service');
      await applyPlanFeatures(result.tenant.id, subscriptionPlan);
      console.log(`✅ Plan features applied successfully for tenant ${result.tenant.id}`);
    } catch (error: any) {
      // Log error but don't fail tenant creation
      // This error happens after the response is sent, so it won't affect the client
      console.error(`⚠️ Error applying plan features (non-blocking) for tenant ${result.tenant.id}:`, error.message || error);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
  });

  return {
    tenant: {
      id: result.tenant.id,
      name: result.tenant.name,
      email: result.tenant.email,
      slug: result.tenant.slug,
      subscriptionEnd: result.tenant.subscriptionEnd,
      subscriptionPlan: result.tenant.subscriptionPlan,
      phone: result.tenant.phone,
      address: result.tenant.address,
    },
    users: result.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      password: result.defaultPassword, // Return password for super admin to share
    })),
    defaultPassword: result.defaultPassword,
  };
  } catch (error: any) {
    // Re-throw AppError as is
    if (error instanceof AppError) {
      throw error;
    }
    // Wrap other errors
    console.error('Error creating tenant:', error);
    throw new AppError(error.message || 'Gagal membuat tenant', 500);
  }
};

export const getTenants = async (page: number = 1, limit: number = 10, includeCounts: boolean = false, useCache: boolean = true): Promise<{
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const skip = (page - 1) * limit;

  // Create cache key
  const cacheKey = `tenants:${page}:${limit}:${includeCounts}`;

  // Try to get from cache first
  if (useCache && !includeCounts) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        // If cache read fails, continue with database query
        logger.warn('Failed to read tenants from cache:', error);
      }
    }
  }

  try {
    // Optimize query: only include _count if explicitly requested
    // This significantly improves performance when there are many tenants
    const tenantQuery: any = {
      where: {
        name: {
          not: 'System', // Sembunyikan tenant System
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    };

    // Only include counts if requested (for detailed views)
    // This makes the default list query much faster
    if (includeCounts) {
      tenantQuery.include = {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
          },
        },
      };
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany(tenantQuery),
      prisma.tenant.count({
        where: {
          name: {
            not: 'System', // Sembunyikan tenant System
          },
        },
      }),
    ]);

    const result = {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result (10 minutes TTL for tenants list, only if not including counts)
    if (useCache && !includeCounts) {
      const redis = getRedisClient();
      if (redis) {
        try {
          await redis.setex(cacheKey, 600, JSON.stringify(result));
        } catch (error) {
          // If cache write fails, continue without caching
          logger.warn('Failed to cache tenants:', error);
        }
      }
    }

    return result;
  } catch (error: any) {
    logger.error('Error in getTenants:', {
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
      page,
      limit,
      includeCounts,
    });
    // If query fails, try without counts as fallback
    if (includeCounts) {
      logger.info('Retrying getTenants without counts...', { page, limit });
      return getTenants(page, limit, false);
    }
    throw error;
  }
};

export const getTenantById = async (id: string, useCache: boolean = true) => {
  const cacheKey = `tenant:${id}`;

  // Try to get from cache first
  if (useCache) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        // If cache read fails, continue with database query
        logger.warn('Failed to read tenant from cache:', error);
      }
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          orders: true,
        },
      },
    },
  });

  // Cache the result (15 minutes TTL for individual tenant)
  if (tenant && useCache) {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.setex(cacheKey, 900, JSON.stringify(tenant));
      } catch (error) {
        // If cache write fails, continue without caching
        logger.warn('Failed to cache tenant:', error);
      }
    }
  }

  return tenant;
};

export interface UpdateTenantInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string;
  isActive?: boolean;
  password?: string; // For updating admin password
}

export const updateTenant = async (id: string, input: UpdateTenantInput) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Check if email is being updated and if it's already taken
  if (input.email && input.email !== tenant.email) {
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: input.email },
    });

    if (existingTenant) {
      throw new AppError('Tenant with this email already exists', 400);
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (input.name) updateData.name = input.name;
  if (input.email) {
    updateData.email = input.email;
    // Update slug if email changes
    updateData.slug = input.email.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.subscriptionPlan) updateData.subscriptionPlan = input.subscriptionPlan;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  // Update tenant and password in a transaction to ensure atomicity
  const updatedTenant = await prisma.$transaction(async (tx) => {
    // Update tenant
    const tenant = await tx.tenant.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
          },
        },
      },
    });

    // If password is provided, update the admin user's password
    if (input.password) {
      // Find admin user with case-insensitive email search if email was updated
      let adminUser = await tx.user.findFirst({
        where: {
          tenantId: id,
          role: 'ADMIN_TENANT',
        },
      });

      // If email was updated, also search by email (case-insensitive)
      if (!adminUser && input.email) {
        adminUser = await tx.user.findFirst({
          where: {
            tenantId: id,
            role: 'ADMIN_TENANT',
            email: {
              equals: input.email,
              mode: 'insensitive',
            },
          },
        });
      }

      if (adminUser) {
        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        // Prepare user update data
        const userUpdateData: any = {
          password: hashedPassword,
          defaultPassword: input.password, // Store new password (plaintext) for Super Admin to view
        };

        // If email was updated, also normalize the user's email to lowercase
        if (input.email) {
          userUpdateData.email = input.email.toLowerCase();
        }

        await tx.user.update({
          where: { id: adminUser.id },
          data: userUpdateData,
        });

        console.log(`✅ Updated admin password for tenant ${id}, user ${adminUser.id}`);
      } else {
        console.warn(`⚠️  Admin user not found for tenant ${id} when updating password`);
      }
    }

    return tenant;
  });

  // Invalidate cache
  const redis = getRedisClient();
  if (redis) {
    try {
      // Invalidate tenant cache
      await redis.del(`tenant:${id}`);
      // Invalidate tenants list cache (all pages)
      const keys = await redis.keys('tenants:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to invalidate tenant cache:', error);
    }
  }

  return updatedTenant;
};

export const deleteTenant = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          orders: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Delete tenant and all related data in transaction
  await prisma.$transaction(async (tx) => {
    // Delete all related data first (due to foreign key constraints)
    // Delete users
    await tx.user.deleteMany({
      where: { tenantId: id },
    });

    // Delete subscriptions
    await tx.subscription.deleteMany({
      where: { tenantId: id },
    });

    // Delete subscription history
    await tx.subscriptionHistory.deleteMany({
      where: { tenantId: id },
    });

    // Delete tenant addons
    await tx.tenantAddon.deleteMany({
      where: { tenantId: id },
    });

    // Delete receipt templates
    await tx.receiptTemplate.deleteMany({
      where: { tenantId: id },
    });

    // Delete products
    await tx.product.deleteMany({
      where: { tenantId: id },
    });

    // Delete orders and order items
    const orders = await tx.order.findMany({
      where: { tenantId: id },
      select: { id: true },
    });

    for (const order of orders) {
      await tx.orderItem.deleteMany({
        where: { orderId: order.id },
      });
    }

    await tx.order.deleteMany({
      where: { tenantId: id },
    });

    // Delete customers
    await tx.customer.deleteMany({
      where: { tenantId: id },
    });

    // Delete members
    await tx.member.deleteMany({
      where: { tenantId: id },
    });

    // Delete outlets
    await tx.outlet.deleteMany({
      where: { tenantId: id },
    });

    // Delete transactions
    await tx.transaction.deleteMany({
      where: { tenantId: id },
    });

    // Delete payment mappings
    await tx.paymentMapping.deleteMany({
      where: { tenantId: id },
    });

    // Delete reports
    await tx.report.deleteMany({
      where: { tenantId: id },
    });

    // Delete discounts
    await tx.discount.deleteMany({
      where: { tenantId: id },
    });

    // Delete employees
    await tx.employee.deleteMany({
      where: { tenantId: id },
    });

    // Finally, delete the tenant
    await tx.tenant.delete({
      where: { id },
    });
  });

  // Invalidate cache
  const redis = getRedisClient();
  if (redis) {
    try {
      // Invalidate tenant cache
      await redis.del(`tenant:${id}`);
      // Invalidate tenants list cache (all pages)
      const keys = await redis.keys('tenants:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to invalidate tenant cache:', error);
    }
  }

  return { message: 'Tenant deleted successfully' };
};

export default { createTenant, getTenants, getTenantById, updateTenant, deleteTenant };
