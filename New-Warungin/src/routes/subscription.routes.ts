import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import subscriptionService from '../services/subscription.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import prisma from '../config/database';

const router = Router();

const extendSubscriptionSchema = z.object({
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  duration: z.number().int().positive(),
});

router.get(
  '/current',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await subscriptionService.getCurrentSubscription(tenantId);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /subscriptions/current:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to load subscription',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

router.post(
  '/extend',
  authGuard,
  validate({ body: extendSubscriptionSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can extend subscription
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can extend subscription' });
      }

      // If plan is provided, use extendSubscription
      // If only duration is provided (Super Admin), use extendSubscriptionCustom
      if (req.body.plan) {
        const result = await subscriptionService.extendSubscription(tenantId, {
          plan: req.body.plan,
          duration: req.body.duration,
        });
        res.json(result);
      } else {
        // Super Admin can extend with custom duration without changing plan
        if (userRole !== 'SUPER_ADMIN') {
          return res.status(403).json({ message: 'Plan is required for tenant admin' });
        }
        const result = await subscriptionService.extendSubscriptionCustom(tenantId, req.body.duration);
        res.json(result);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

const upgradeSubscriptionSchema = z.object({
  newPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  upgradeType: z.enum(['temporary', 'until_end', 'custom']),
  customDuration: z.number().int().positive().optional(),
});

const reduceSubscriptionSchema = z.object({
  duration: z.number().int().positive(),
});

router.post(
  '/upgrade',
  authGuard,
  validate({ body: upgradeSubscriptionSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can upgrade subscription
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can upgrade subscription' });
      }

      const result = await subscriptionService.upgradeSubscription(tenantId, {
        newPlan: req.body.newPlan,
        upgradeType: req.body.upgradeType,
        customDuration: req.body.customDuration,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/reduce',
  authGuard,
  validate({ body: reduceSubscriptionSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can reduce subscription
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can reduce subscription' });
      }

      const result = await subscriptionService.reduceSubscriptionCustom(tenantId, req.body.duration);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  '/history',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      // Get subscription history from SubscriptionHistory table
      const subscriptions = await prisma.subscriptionHistory.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      
      const total = await prisma.subscriptionHistory.count({
        where: { tenantId },
      });

      res.json({
        data: subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Manual trigger for reverting temporary upgrades
 * Only accessible by SUPER_ADMIN
 */
router.post(
  '/revert-temporary',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userRole = authReq.role || authReq.user?.role;
      
      // Only SUPER_ADMIN can trigger manual revert
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can trigger revert' });
      }

      const result = await subscriptionService.revertTemporaryUpgrades();
      res.json({
        success: true,
        message: `Reverted ${result.reverted} temporary upgrades, ${result.failed} failed`,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Delete subscription (Super Admin only)
 */
router.delete(
  '/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userRole = authReq.role || authReq.user?.role;
      
      // Only SUPER_ADMIN can delete subscription
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can delete subscription' });
      }

      const subscriptionId = req.params.id;
      
      // Check if subscription exists
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          tenant: {
            select: {
              id: true,
              subscriptionPlan: true,
              subscriptionEnd: true,
              subscriptionStart: true,
            },
          },
        },
      });

      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }

      const tenantId = subscription.tenantId;

      // Delete subscription (this is just a record deletion, not affecting tenant subscription)
      // The tenant.subscriptionEnd and tenant.subscriptionPlan should remain unchanged
      // unless this was the only active subscription and tenant.subscriptionEnd is expired
      await prisma.subscription.delete({
        where: { id: subscriptionId },
      });

      // Check if there are other active subscriptions for this tenant
      const otherActiveSubscriptions = await prisma.subscription.findFirst({
        where: {
          tenantId: tenantId,
          id: { not: subscriptionId },
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      });

      // Only update tenant if:
      // 1. This was the only active subscription AND
      // 2. tenant.subscriptionEnd is expired or null
      // Otherwise, keep tenant.subscriptionEnd and tenant.subscriptionPlan as is
      if (!otherActiveSubscriptions) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            subscriptionEnd: true,
            subscriptionPlan: true,
          },
        });

        const now = new Date();
        // Only revert if subscriptionEnd is expired or null
        if (!tenant?.subscriptionEnd || tenant.subscriptionEnd < now) {
          // No active subscriptions and subscriptionEnd is expired, revert to BASIC
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              subscriptionPlan: 'BASIC',
              temporaryUpgrade: false,
              previousPlan: null,
            },
          });

          // Apply BASIC plan features
          const { applyPlanFeatures } = await import('../services/plan-features.service');
          await applyPlanFeatures(tenantId, 'BASIC');

          // Deactivate users
          const { updateUserStatusBasedOnSubscription } = await import('../services/user-status.service');
          await updateUserStatusBasedOnSubscription(tenantId);
        }
        // If subscriptionEnd is still valid, keep it as is (don't revert)
      }

      res.json({ message: 'Subscription deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      res.status(500).json({ message: error.message || 'Failed to delete subscription' });
    }
  }
);

/**
 * Bulk delete subscriptions (Super Admin only)
 */
router.post(
  '/bulk-delete',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userRole = authReq.role || authReq.user?.role;
      
      // Only SUPER_ADMIN can bulk delete subscriptions
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can bulk delete subscriptions' });
      }

      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
      }

      // Get subscriptions to be deleted to check their tenantIds
      const subscriptionsToDelete = await prisma.subscription.findMany({
        where: {
          id: { in: ids },
        },
        select: {
          id: true,
          tenantId: true,
        },
      });

      // Get unique tenantIds
      const tenantIds = [...new Set(subscriptionsToDelete.map(s => s.tenantId))];

      // Delete subscriptions (this is just a record deletion, not affecting tenant subscription)
      const result = await prisma.subscription.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      // For each affected tenant, check if they still have active subscriptions
      // Only revert to BASIC if no active subscriptions and subscriptionEnd is expired
      for (const tenantId of tenantIds) {
        const otherActiveSubscriptions = await prisma.subscription.findFirst({
          where: {
            tenantId: tenantId,
            id: { notIn: ids },
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        });

        if (!otherActiveSubscriptions) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
              subscriptionEnd: true,
              subscriptionPlan: true,
            },
          });

          const now = new Date();
          // Only revert if subscriptionEnd is expired or null
          if (!tenant?.subscriptionEnd || tenant.subscriptionEnd < now) {
            // No active subscriptions and subscriptionEnd is expired, revert to BASIC
            await prisma.tenant.update({
              where: { id: tenantId },
              data: {
                subscriptionPlan: 'BASIC',
                temporaryUpgrade: false,
                previousPlan: null,
              },
            });

            // Apply BASIC plan features
            const { applyPlanFeatures } = await import('../services/plan-features.service');
            await applyPlanFeatures(tenantId, 'BASIC');

            // Deactivate users
            const { updateUserStatusBasedOnSubscription } = await import('../services/user-status.service');
            await updateUserStatusBasedOnSubscription(tenantId);
          }
          // If subscriptionEnd is still valid, keep it as is (don't revert)
        }
      }

      res.json({ 
        message: `${result.count} subscription(s) deleted successfully`,
        deletedCount: result.count,
      });
    } catch (error: any) {
      console.error('Error bulk deleting subscriptions:', error);
      res.status(500).json({ message: error.message || 'Failed to bulk delete subscriptions' });
    }
  }
);

export default router;

