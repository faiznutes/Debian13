/**
 * GDPR Compliance Routes
 * Handles data export and deletion requests
 */

import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import gdprService from '../services/gdpr.service';
import logger from '../utils/logger';
import { requireTenantId } from '../utils/tenant';

const router = Router();

/**
 * @swagger
 * /api/gdpr/export:
 *   get:
 *     summary: Export user data (GDPR Right to Data Portability)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export',
  authGuard,
  requireTenantId,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const data = await gdprService.exportUserData(userId, tenantId);
      const exportFile = await gdprService.generateExportFile(data, 'json');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="warungin-data-export-${Date.now()}.json"`);
      res.send(exportFile);
    } catch (error: any) {
      logger.error('Error exporting user data', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/gdpr/delete:
 *   post:
 *     summary: Delete user data (GDPR Right to be Forgotten)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/delete',
  authGuard,
  requireTenantId,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      // Require confirmation
      const { confirm } = req.body;
      if (!confirm || confirm !== 'DELETE_MY_DATA') {
        return res.status(400).json({
          message: 'Confirmation required. Send { "confirm": "DELETE_MY_DATA" } to proceed.',
        });
      }

      await gdprService.deleteUserData(userId, tenantId);

      res.json({
        message: 'Data Anda telah dihapus sesuai permintaan GDPR. Akun Anda telah dinonaktifkan.',
      });
    } catch (error: any) {
      logger.error('Error deleting user data', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/gdpr/export-tenant:
 *   get:
 *     summary: Export tenant data (for tenant admin)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export-tenant',
  authGuard,
  requireTenantId,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userRole = req.role;

      // Only ADMIN_TENANT and SUPER_ADMIN can export tenant data
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can export tenant data' });
      }

      const data = await gdprService.exportTenantData(tenantId);
      const exportFile = await gdprService.generateExportFile(data, 'json');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="warungin-tenant-export-${tenantId}-${Date.now()}.json"`);
      res.send(exportFile);
    } catch (error: any) {
      logger.error('Error exporting tenant data', { error: error.message, tenantId: req.tenantId });
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

