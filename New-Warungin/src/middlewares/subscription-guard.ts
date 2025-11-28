import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';
import { updateUserStatusBasedOnSubscription, getTotalRemainingSubscriptionTime } from '../services/user-status.service';

/**
 * Middleware to check if tenant subscription is active
 * Blocks access to protected features (POS, Kitchen, Orders, Products, etc.) if subscription is expired
 * Auto updates user status based on subscription expiry
 */
export const subscriptionGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip check for SUPER_ADMIN and ADMIN_TENANT
    // ADMIN_TENANT needs access to manage subscription even when expired
    if (req.role === 'SUPER_ADMIN' || req.role === 'ADMIN_TENANT') {
      // Still update subscription status in background (but not user status for ADMIN_TENANT)
      // ADMIN_TENANT can manage user status manually, so we don't auto-activate/deactivate
      const tenantId = req.tenantId;
      if (tenantId) {
        // Run background subscription check without blocking the request
        // Use setImmediate to run asynchronously and not block the request
        setImmediate(async () => {
          try {
            const tenant = await prisma.tenant.findUnique({
              where: { id: tenantId },
              select: {
                id: true,
                subscriptionEnd: true,
                subscriptionPlan: true,
                temporaryUpgrade: true,
                previousPlan: true,
              },
            });

            if (tenant) {
              const now = new Date();
              const subscriptionEnd = tenant.subscriptionEnd;

              // Check if temporary upgrade subscription has expired (even if tenant.subscriptionEnd is still in future)
              // BUT: Only check if tenant still has temporaryUpgrade flag (not already reverted)
              // This prevents multiple reverts on the same tenant
              let shouldRevertTemporaryUpgrade = false;
              if (tenant.temporaryUpgrade === true && tenant.previousPlan) {
                // Find temporary subscription to check if it has expired
                const temporarySubscription = await prisma.subscription.findFirst({
                  where: {
                    tenantId: tenantId,
                    temporaryUpgrade: true,
                    status: { in: ['ACTIVE', 'EXPIRED'] },
                  },
                  orderBy: { createdAt: 'desc' },
                });

              if (temporarySubscription && temporarySubscription.endDate && temporarySubscription.endDate <= now) {
                shouldRevertTemporaryUpgrade = true;
                console.log(`🔄 Temporary upgrade expired for tenant ${tenantId}. Subscription end: ${temporarySubscription.endDate.toISOString()}, Now: ${now.toISOString()}`);
              }
            }

            // Auto revert to BASIC and deactivate users if subscription is expired
            // OR if temporary upgrade subscription has expired
            // IMPORTANT: Only revert if tenant still has temporaryUpgrade flag (not already reverted)
            // This prevents multiple reverts on the same tenant
            // NOTE: Background check only - don't block request, just update in background
            // IMPORTANT: For temporary upgrades, only revert if temporary subscription expired (shouldRevertTemporaryUpgrade)
            // Don't revert based on tenant.subscriptionEnd < now for temporary upgrades, as it might still be in the future
            if (tenant.temporaryUpgrade === true) {
              // This is a temporary upgrade
              if (shouldRevertTemporaryUpgrade && tenant.previousPlan) {
                // Temporary subscription has expired, revert with remaining time calculation
                try {
                  const subscriptionService = await import('../services/subscription.service');
                  
                  // Call revertTemporaryUpgrades logic for this specific tenant
                  // This will calculate remaining time and revert properly
                  // The function itself will check if already reverted to prevent multiple reverts
                  await subscriptionService.default.revertTemporaryUpgradeForTenant(tenantId);
                  
                  console.log(`✅ Auto-reverted temporary upgrade for tenant ${tenantId} with remaining time calculation (background update)`);
                  
                  // Only auto-deactivate users if subscription expired (not for ADMIN_TENANT manual management)
                  // For ADMIN_TENANT, let them manage user status manually
                  if (req.role !== 'ADMIN_TENANT') {
                    await updateUserStatusBasedOnSubscription(tenantId);
                  }
                } catch (error: any) {
                  console.error('Error reverting temporary upgrade (background):', error);
                  // Don't throw error in background check - just log it
                }
              }
              // If temporary upgrade hasn't expired yet, don't revert
            } else if ((!subscriptionEnd || subscriptionEnd < now) && tenant.subscriptionPlan !== 'BASIC') {
              // Not a temporary upgrade, just revert to BASIC if expired
              try {
                const { applyPlanFeatures } = await import('../services/plan-features.service');
                
                await prisma.tenant.update({
                  where: { id: tenantId },
                  data: {
                    subscriptionPlan: 'BASIC',
                    temporaryUpgrade: false,
                    previousPlan: null,
                  },
                });

                // Apply BASIC plan features (auto-disable users/outlets that exceed limit)
                await applyPlanFeatures(tenantId, 'BASIC');
                
                console.log(`✅ Auto-reverted ${tenant.subscriptionPlan} subscription to BASIC for tenant ${tenantId} (background update)`);
                
                // Only auto-deactivate users if subscription expired (not for ADMIN_TENANT manual management)
                // For ADMIN_TENANT, let them manage user status manually
                if (req.role !== 'ADMIN_TENANT') {
                  await updateUserStatusBasedOnSubscription(tenantId);
                }
              } catch (error: any) {
                console.error('Error updating subscription and user status (background):', error);
                // Don't throw error in background check - just log it
              }
              }
              // Note: We don't auto-activate users for ADMIN_TENANT when subscription is active
              // ADMIN_TENANT can manage user status manually
            }
          } catch (error: any) {
            console.error('Error in background subscription check:', error);
            // Don't throw error in background check - just log it
          }
        });
      }
      
      next();
      return;
    }

    // Get tenantId from request
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(403).json({ 
        error: 'Forbidden: Tenant ID not found',
        code: 'TENANT_ID_MISSING'
      });
      return;
    }

    // Get tenant with subscription info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        isActive: true,
        subscriptionEnd: true,
        subscriptionPlan: true,
        temporaryUpgrade: true,
        previousPlan: true,
      },
    });

    if (!tenant) {
      res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
      return;
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      res.status(403).json({ 
        error: 'Forbidden: Tenant is inactive',
        code: 'TENANT_INACTIVE'
      });
      return;
    }

    // Check subscription status using latest end date across all active subscriptions
    const now = new Date();
    const latestEndDate = await getTotalRemainingSubscriptionTime(tenantId);

    if (!latestEndDate) {
      // Auto revert to BASIC and deactivate users if subscription is null
      try {
        // Auto revert to BASIC if not already BASIC
        if (tenant.subscriptionPlan !== 'BASIC') {
          const { applyPlanFeatures } = await import('../services/plan-features.service');
          
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              subscriptionPlan: 'BASIC',
              temporaryUpgrade: false,
              previousPlan: null,
            },
          });

          // Apply BASIC plan features (auto-disable users/outlets that exceed limit)
          await applyPlanFeatures(tenantId, 'BASIC');
          
          console.log(`✅ Auto-reverted ${tenant.subscriptionPlan} subscription to BASIC for tenant ${tenantId} (no subscription end)`);
        }
        
        // Deactivate CASHIER, KITCHEN, SUPERVISOR users if subscription is null
        // ADMIN_TENANT is excluded (always remains active)
        await updateUserStatusBasedOnSubscription(tenantId);
      } catch (error: any) {
        console.error('Error updating subscription and user status:', error);
      }
      
      res.status(403).json({ 
        error: 'Forbidden: No active subscription',
        code: 'NO_SUBSCRIPTION',
        message: 'Langganan belum diaktifkan. Silakan hubungi administrator.'
      });
      return;
    }

    // Check if subscription is expired
    if (latestEndDate <= now) {
      // Auto revert to BASIC and deactivate users if subscription is expired
      try {
        // Check if this is a temporary upgrade that needs to revert with remaining time calculation
        if (tenant.temporaryUpgrade === true && tenant.previousPlan) {
          // This is a temporary upgrade, need to calculate remaining time
          const subscriptionService = await import('../services/subscription.service');
          
          // Call revertTemporaryUpgrades logic for this specific tenant
          // This will calculate remaining time and revert properly
          await subscriptionService.default.revertTemporaryUpgradeForTenant(tenantId);
          
          console.log(`✅ Auto-reverted temporary upgrade for tenant ${tenantId} with remaining time calculation`);
        } else if (tenant.subscriptionPlan !== 'BASIC') {
          // Not a temporary upgrade, just revert to BASIC
          const { applyPlanFeatures } = await import('../services/plan-features.service');
          
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              subscriptionPlan: 'BASIC',
              temporaryUpgrade: false,
              previousPlan: null,
            },
          });

          // Apply BASIC plan features (auto-disable users/outlets that exceed limit)
          await applyPlanFeatures(tenantId, 'BASIC');
          
          console.log(`✅ Auto-reverted expired ${tenant.subscriptionPlan} subscription to BASIC for tenant ${tenantId}`);
        }
        
        // Deactivate CASHIER, KITCHEN, SUPERVISOR users if subscription expired
        // ADMIN_TENANT is excluded (always remains active)
        await updateUserStatusBasedOnSubscription(tenantId);
      } catch (error: any) {
        console.error('Error updating subscription and user status:', error);
      }
      
      res.status(403).json({ 
        error: 'Forbidden: Subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Langganan telah kedaluwarsa. Silakan perpanjang langganan untuk melanjutkan menggunakan layanan.',
        expiredDate: latestEndDate ? latestEndDate.toISOString() : null,
      });
      return;
    }

    // Subscription is active by any plan, auto activate users
    try {
      await updateUserStatusBasedOnSubscription(tenantId);
    } catch (error: any) {
      console.error('Error updating user status:', error);
    }

    // Subscription is active, allow access
    next();
  } catch (error: any) {
    console.error('Subscription guard error:', error);
    // Pass error to Express error handler
    next(error);
  }
};

