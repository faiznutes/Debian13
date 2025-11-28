import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import archiveService from '../services/archive.service';
import { requireTenantId } from '../utils/tenant';
import { AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { auditLogger } from '../middlewares/audit-logger';
import * as path from 'path';
import * as fs from 'fs';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const archiveOrdersSchema = z.object({
  olderThanDays: z.number().int().positive().optional().default(365),
});

const archiveTransactionsSchema = z.object({
  olderThanDays: z.number().int().positive().optional().default(365),
});

const archiveReportsSchema = z.object({
  olderThanDays: z.number().int().positive().optional().default(180),
});

const archiveAllSchema = z.object({
  ordersOlderThanDays: z.number().int().positive().optional().default(365),
  transactionsOlderThanDays: z.number().int().positive().optional().default(365),
  reportsOlderThanDays: z.number().int().positive().optional().default(180),
});

const restoreArchiveSchema = z.object({
  archiveFile: z.string().min(1, 'Archive file path is required'),
});

/**
 * @swagger
 * /api/archives/stats:
 *   get:
 *     summary: Get archive statistics
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archive statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ordersArchived:
 *                   type: integer
 *                 transactionsArchived:
 *                   type: integer
 *                 reportsArchived:
 *                   type: integer
 *                 totalSize:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/stats',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const stats = await archiveService.getArchiveStats(tenantId);
      res.json(stats);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/files:
 *   get:
 *     summary: List archive files
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archive files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       path:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [orders, transactions, reports]
 *                       size:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/files',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const archivePath = path.join('./archives', tenantId);
      
      if (!fs.existsSync(archivePath)) {
        return res.json({ files: [] });
      }

      const files: Array<{
        name: string;
        path: string;
        type: 'orders' | 'transactions' | 'reports';
        size: number;
        createdAt: Date;
      }> = [];

      const ordersDir = path.join(archivePath, 'orders');
      const transactionsDir = path.join(archivePath, 'transactions');
      const reportsDir = path.join(archivePath, 'reports');

      // Get orders files
      if (fs.existsSync(ordersDir)) {
        const orderFiles = fs.readdirSync(ordersDir);
        orderFiles.forEach(file => {
          const filePath = path.join(ordersDir, file);
          const stats = fs.statSync(filePath);
          files.push({
            name: file,
            path: filePath,
            type: 'orders',
            size: stats.size,
            createdAt: stats.birthtime,
          });
        });
      }

      // Get transactions files
      if (fs.existsSync(transactionsDir)) {
        const transactionFiles = fs.readdirSync(transactionsDir);
        transactionFiles.forEach(file => {
          const filePath = path.join(transactionsDir, file);
          const stats = fs.statSync(filePath);
          files.push({
            name: file,
            path: filePath,
            type: 'transactions',
            size: stats.size,
            createdAt: stats.birthtime,
          });
        });
      }

      // Get reports files
      if (fs.existsSync(reportsDir)) {
        const reportFiles = fs.readdirSync(reportsDir);
        reportFiles.forEach(file => {
          const filePath = path.join(reportsDir, file);
          const stats = fs.statSync(filePath);
          files.push({
            name: file,
            path: filePath,
            type: 'reports',
            size: stats.size,
            createdAt: stats.birthtime,
          });
        });
      }

      // Sort by creation date (newest first)
      files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json({ files });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/orders:
 *   post:
 *     summary: Archive old orders
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *                 description: Archive orders older than this many days
 *     responses:
 *       200:
 *         description: Orders archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       403:
 *         description: Forbidden - Only admin can archive
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/orders',
  authGuard,
  validate({ body: archiveOrdersSchema }),
  auditLogger('ARCHIVE', 'orders'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { olderThanDays } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can archive
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can archive data' });
      }

      const count = await archiveService.archiveOldOrders(tenantId, olderThanDays);
      res.json({
        message: `Archived ${count} orders`,
        count,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/transactions:
 *   post:
 *     summary: Archive old transactions
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *     responses:
 *       200:
 *         description: Transactions archived successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/transactions',
  authGuard,
  validate({ body: archiveTransactionsSchema }),
  auditLogger('ARCHIVE', 'transactions'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { olderThanDays } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can archive
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can archive data' });
      }

      const count = await archiveService.archiveOldTransactions(tenantId, olderThanDays);
      res.json({
        message: `Archived ${count} transactions`,
        count,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/reports:
 *   post:
 *     summary: Archive old reports
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 180
 *     responses:
 *       200:
 *         description: Reports archived successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/reports',
  authGuard,
  validate({ body: archiveReportsSchema }),
  auditLogger('ARCHIVE', 'reports'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { olderThanDays } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can archive
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can archive data' });
      }

      const count = await archiveService.archiveOldReports(tenantId, olderThanDays);
      res.json({
        message: `Archived ${count} reports`,
        count,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/all:
 *   post:
 *     summary: Archive all old data
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ordersOlderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *               transactionsOlderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *               reportsOlderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 180
 *     responses:
 *       200:
 *         description: All data archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 ordersArchived:
 *                   type: integer
 *                 transactionsArchived:
 *                   type: integer
 *                 reportsArchived:
 *                   type: integer
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/all',
  authGuard,
  validate({ body: archiveAllSchema }),
  auditLogger('ARCHIVE', 'all'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      
      // Only ADMIN_TENANT and SUPER_ADMIN can archive
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can archive data' });
      }

      const result = await archiveService.archiveAllOldData(tenantId, req.body);
      res.json({
        message: 'Archived all old data',
        ...result,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

/**
 * @swagger
 * /api/archives/restore:
 *   post:
 *     summary: Restore from archive
 *     tags: [Archives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - archiveFile
 *             properties:
 *               archiveFile:
 *                 type: string
 *                 minLength: 1
 *                 description: Path to archive file to restore
 *     responses:
 *       200:
 *         description: Archive restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Only admin can restore or archive file doesn't belong to tenant
 *       404:
 *         description: Archive file not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/restore',
  authGuard,
  validate({ body: restoreArchiveSchema }),
  auditLogger('RESTORE', 'archives'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { archiveFile } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can restore
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can restore data' });
      }

      // Verify archive file belongs to tenant
      if (!archiveFile.includes(tenantId)) {
        return res.status(403).json({ message: 'Archive file does not belong to this tenant' });
      }

      await archiveService.restoreArchivedData(tenantId, archiveFile);
      res.json({
        message: 'Archive restored successfully',
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ARCHIVE');
    }
  }
);

export default router;

