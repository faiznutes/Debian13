import { Router, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import rewardPointService from '../services/reward-point.service';
import { requireTenantId } from '../utils/tenant';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/rewards/balance
 * Get current reward points balance
 */
router.get(
  '/balance',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      const balance = await rewardPointService.getBalance(tenantId, userId);
      res.json(balance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * GET /api/rewards/daily-limit
 * Get daily ad view limit status
 */
router.get(
  '/daily-limit',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      const limit = await rewardPointService.checkDailyLimit(tenantId, userId);
      res.json(limit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/watch-ad
 * Record ad view and award points
 */
router.post(
  '/watch-ad',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      const { adMetadata } = req.body;

      const result = await rewardPointService.recordAdView(
        tenantId,
        userId,
        adMetadata
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * GET /api/rewards/transactions
 * Get reward point transactions history
 */
router.get(
  '/transactions',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const transactions = await rewardPointService.getTransactions(
        tenantId,
        userId,
        limit
      );

      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/redeem/subscription
 * Redeem points for subscription
 */
router.post(
  '/redeem/subscription',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      const { planId, pointsRequired } = req.body;

      if (!planId || !pointsRequired) {
        return res.status(400).json({
          message: 'planId and pointsRequired are required',
        });
      }

      console.log('[Redeem Subscription]', { tenantId, userId, planId, pointsRequired });

      const result = await rewardPointService.redeemForSubscription(
        tenantId,
        userId,
        planId,
        pointsRequired
      );

      res.json({
        success: true,
        message: 'Point berhasil ditukar untuk langganan',
        balance: result,
      });
    } catch (error: any) {
      console.error('[Redeem Subscription] Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/redeem/addon
 * Redeem points for addon
 */
router.post(
  '/redeem/addon',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      const { addonId, addonName, pointsRequired } = req.body;

      if (!addonId || !addonName || !pointsRequired) {
        return res.status(400).json({
          message: 'addonId, addonName, and pointsRequired are required',
        });
      }

      console.log('[Redeem Addon]', { tenantId, userId, addonId, addonName, pointsRequired });

      const result = await rewardPointService.redeemForAddon(
        tenantId,
        userId,
        addonId,
        addonName,
        pointsRequired
      );

      res.json({
        success: true,
        message: 'Point berhasil ditukar untuk addon',
        balance: result,
      });
    } catch (error: any) {
      console.error('[Redeem Addon] Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * GET /api/rewards/config
 * Get point configuration and available redemptions
 */
router.get(
  '/config',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      console.log('[Rewards Config] Request from tenantId:', tenantId);
      
      const config = rewardPointService.getPointConfig();
      const redemptions = rewardPointService.getAvailableRedemptions();

      console.log('[Rewards Config] Subscriptions:', redemptions.subscriptions.length);
      console.log('[Rewards Config] Addons:', redemptions.addons.length);
      console.log('[Rewards Config] Subscription data:', JSON.stringify(redemptions.subscriptions, null, 2));
      console.log('[Rewards Config] Addon data:', JSON.stringify(redemptions.addons, null, 2));

      res.json({
        config,
        redemptions,
      });
    } catch (error: any) {
      console.error('[Rewards Config] Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/check-expiration
 * Manually check and expire old points
 */
router.post(
  '/check-expiration',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user?.id;

      const expiredPoints = await rewardPointService.checkAndExpirePoints(tenantId, userId);

      res.json({
        success: true,
        expiredPoints,
        message: expiredPoints > 0 
          ? `${expiredPoints} point telah kadaluarsa`
          : 'Tidak ada point yang kadaluarsa',
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * GET /api/rewards/tenant/:tenantId/balance
 * Get tenant reward points balance (Super Admin only)
 */
router.get(
  '/tenant/:tenantId/balance',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only Super Admin can access this endpoint' });
      }

      const tenantId = req.params.tenantId;
      const balance = await rewardPointService.getTenantBalance(tenantId);
      res.json(balance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * GET /api/rewards/tenant/:tenantId/transactions
 * Get tenant reward points transactions (Super Admin only)
 */
router.get(
  '/tenant/:tenantId/transactions',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only Super Admin can access this endpoint' });
      }

      const tenantId = req.params.tenantId;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await rewardPointService.getTenantTransactions(tenantId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/tenant/:tenantId/update
 * Update tenant reward points (Super Admin only)
 */
router.post(
  '/tenant/:tenantId/update',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only Super Admin can access this endpoint' });
      }

      const tenantId = req.params.tenantId;
      const { points, reason } = req.body;

      if (typeof points !== 'number') {
        return res.status(400).json({ message: 'Points must be a number' });
      }

      const result = await rewardPointService.updateTenantPoints(tenantId, points, reason || '');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/rewards/user/:userId/update
 * Update user reward points (Admin Tenant or Super Admin)
 */
router.post(
  '/user/:userId/update',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = requireTenantId(req);
      const targetUserId = req.params.userId;
      const { points, reason } = req.body;

      // Admin Tenant can only update users in their tenant
      // Super Admin can update any user
      if (user?.role === 'ADMIN_TENANT') {
        // Verify user belongs to the same tenant
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { tenantId: true },
        });

        if (!targetUser || targetUser.tenantId !== tenantId) {
          return res.status(403).json({ message: 'User not found or does not belong to your tenant' });
        }
      } else if (user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only Admin Tenant or Super Admin can access this endpoint' });
      }

      if (typeof points !== 'number') {
        return res.status(400).json({ message: 'Points must be a number' });
      }

      const result = await rewardPointService.updateUserPoints(tenantId, targetUserId, points, reason || '');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;

