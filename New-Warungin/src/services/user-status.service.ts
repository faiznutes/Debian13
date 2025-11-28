import prisma from '../config/database';

/**
 * Calculate total remaining time from all active subscriptions (basic, boost, max)
 * Returns the latest endDate from all active subscriptions
 */
export async function getTotalRemainingSubscriptionTime(tenantId: string): Promise<Date | null> {
  const now = new Date();
  
  // Get all subscriptions that are still active (not expired)
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      endDate: {
        gt: now, // Only get subscriptions that haven't expired yet
      },
    },
    orderBy: {
      endDate: 'desc', // Get the latest endDate
    },
  });

  // Also check tenant.subscriptionEnd as fallback
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionEnd: true,
    },
  });

  // Get the latest endDate from all sources
  let latestEndDate: Date | null = null;
  
  // Check all active subscriptions
  if (activeSubscriptions.length > 0) {
    latestEndDate = activeSubscriptions[0].endDate;
  }
  
  // Also check tenant.subscriptionEnd (might be later than subscription records)
  if (tenant?.subscriptionEnd) {
    if (!latestEndDate || tenant.subscriptionEnd > latestEndDate) {
      latestEndDate = tenant.subscriptionEnd;
    }
  }

  return latestEndDate;
}

/**
 * Auto update user status based on subscription expiry
 * Deactivate CASHIER, KITCHEN, and SUPERVISOR users if ALL subscriptions are expired (basic 0, boost 0, max 0)
 * ADMIN_TENANT is excluded from deactivation (always remains active)
 * Only SUPER_ADMIN can activate users if all subscriptions are expired
 * 
 * IMPORTANT: User is active if ANY subscription (basic, boost, or max) still has remaining time
 */
export async function updateUserStatusBasedOnSubscription(tenantId: string) {
  try {
    // Get tenant with subscription info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        subscriptionEnd: true,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const now = new Date();
    
    // IMPORTANT: Calculate total remaining time from ALL active subscriptions (basic, boost, max)
    // User is active if ANY subscription still has remaining time
    const latestEndDate = await getTotalRemainingSubscriptionTime(tenantId);
    
    // Check if ALL subscriptions are expired (basic 0, boost 0, max 0)
    // Only deactivate if there's NO remaining time from ANY subscription
    const isExpired = !latestEndDate || latestEndDate <= now;
    
    // Get all users for this tenant (CASHIER, KITCHEN, SUPERVISOR only - exclude ADMIN_TENANT)
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          in: ['CASHIER', 'KITCHEN', 'SUPERVISOR'],
        },
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    // Update user status based on subscription
    if (isExpired) {
      // Deactivate CASHIER, KITCHEN, SUPERVISOR users if subscription expired
      // ADMIN_TENANT is excluded (always remains active)
      await prisma.user.updateMany({
        where: {
          tenantId,
          role: {
            in: ['CASHIER', 'KITCHEN', 'SUPERVISOR'],
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      
      console.log(`✅ Deactivated CASHIER, KITCHEN, SUPERVISOR users for tenant ${tenantId} due to expired subscription (ADMIN_TENANT excluded)`);
    } else {
      // Activate CASHIER, KITCHEN, SUPERVISOR users if subscription is active
      // ADMIN_TENANT can be activated manually by SUPER_ADMIN
      await prisma.user.updateMany({
        where: {
          tenantId,
          role: {
            in: ['CASHIER', 'KITCHEN', 'SUPERVISOR'],
          },
          isActive: false,
        },
        data: {
          isActive: true,
        },
      });
      
      console.log(`✅ Activated CASHIER, KITCHEN, SUPERVISOR users for tenant ${tenantId} due to active subscription`);
    }

    return {
      tenantId,
      isExpired,
      usersUpdated: users.length,
    };
  } catch (error: any) {
    console.error(`Error updating user status for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Check and update user status for all tenants
 * This can be called periodically (e.g., via cron job)
 */
export async function checkAndUpdateAllTenantsUserStatus() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        name: {
          not: 'System',
        },
      },
      select: {
        id: true,
      },
    });

    const results = await Promise.allSettled(
      tenants.map(tenant => updateUserStatusBasedOnSubscription(tenant.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Updated user status for ${successful} tenants, ${failed} failed`);

    return {
      total: tenants.length,
      successful,
      failed,
    };
  } catch (error: any) {
    console.error('Error checking and updating all tenants user status:', error);
    throw error;
  }
}

