import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import twoFactorService from '../services/2fa.service';
import { z } from 'zod';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import logger from '../utils/logger';
import prisma from '../config/database';

const router = Router();

const enable2FASchema = z.object({
  token: z.string().length(6, 'Token harus 6 digit'),
});

const disable2FASchema = z.object({
  password: z.string().min(1, 'Password wajib diisi'),
});

/**
 * @swagger
 * /api/2fa/generate:
 *   post:
 *     summary: Generate 2FA secret and QR code
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/generate',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = (req as any).user;
      
      // Get tenant ID - for SUPER_ADMIN, try query param or user's tenantId
      // For other roles, use user's tenantId
      let tenantId: string | null = null;
      let tenantName: string | undefined = undefined;
      
      if (user.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN can specify tenantId via query, or use their own tenantId if they have one
        tenantId = (req.query.tenantId as string) || user.tenantId || null;
      } else {
        // For other roles, use tenantId from user
        tenantId = user.tenantId || (req as any).tenantId || null;
      }

      // Get tenant name for service name (optional - if tenantId exists)
      if (tenantId) {
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true },
          });
          tenantName = tenant?.name;
        } catch (err) {
          // If tenant not found, continue without tenant name
          logger.warn('Tenant not found for 2FA generation', { tenantId, userId });
        }
      }

      const result = await twoFactorService.generateSecret(
        userId,
        user.email,
        tenantName
      );

      res.json({
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
        message: 'Simpan backup codes di tempat yang aman!',
      });
    } catch (error: any) {
      logger.error('Error generating 2FA secret', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/2fa/enable:
 *   post:
 *     summary: Enable 2FA for user
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/enable',
  authGuard,
  validate({ body: enable2FASchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { token } = req.body;

      logger.info('2FA enable request received', { 
        userId, 
        tokenLength: token?.length,
        token: token?.substring(0, 2) + '****' // Log first 2 chars only for security
      });

      await twoFactorService.enable2FA(userId, token);

      logger.info('2FA enabled successfully', { userId });
      res.json({ message: '2FA berhasil diaktifkan' });
    } catch (error: any) {
      logger.error('Error enabling 2FA', { 
        error: error.message, 
        stack: error.stack,
        userId: req.userId,
        tokenLength: req.body?.token?.length
      });
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA for user
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/disable',
  authGuard,
  validate({ body: disable2FASchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { password } = req.body;

      await twoFactorService.disable2FA(userId, password);

      res.json({ message: '2FA berhasil dinonaktifkan' });
    } catch (error: any) {
      logger.error('Error disabling 2FA', { error: error.message, userId: req.userId });
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verify 2FA token
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/verify',
  authGuard,
  validate({ body: enable2FASchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { token } = req.body;

      const isValid = await twoFactorService.verifyToken(userId, token);

      if (!isValid) {
        return res.status(401).json({ message: 'Token 2FA tidak valid' });
      }

      res.json({ message: 'Token 2FA valid' });
    } catch (error: any) {
      logger.error('Error verifying 2FA token', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/2fa/status:
 *   get:
 *     summary: Get 2FA status
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/status',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const isEnabled = await twoFactorService.is2FAEnabled(userId);
      const remainingBackupCodes = await twoFactorService.getRemainingBackupCodes(userId);

      res.json({
        enabled: isEnabled,
        remainingBackupCodes,
      });
    } catch (error: any) {
      logger.error('Error getting 2FA status', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

