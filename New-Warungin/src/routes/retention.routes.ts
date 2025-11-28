import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import retentionService from '../services/retention.service';
import { requireTenantId } from '../utils/tenant';
import { AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { logAction } from '../middlewares/audit-logger';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const applyRetentionSchema = z.object({
  days: z.number().int().positive().optional(),
});

const applyAllRetentionSchema = z.object({
  policy: z.object({
    orders: z.number().int().positive().optional(),
    transactions: z.number().int().positive().optional(),
    reports: z.number().int().positive().optional(),
    auditLogs: z.number().int().positive().optional(),
    contactSubmissions: z.number().int().positive().optional(),
    demoRequests: z.number().int().positive().optional(),
  }).optional(),
});

/**
 * @swagger
 * /api/retention/stats:
 *   get:
 *     summary: Get retention policy statistics
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policy
 *         schema:
 *           type: string
 *         description: JSON string of retention policy
 *     responses:
 *       200:
 *         description: Retention statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     eligible: { type: integer }
 *                 transactions:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     eligible: { type: integer }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/stats',
  authGuard,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const policy = req.query.policy ? JSON.parse(req.query.policy as string) : undefined;
      const stats = await retentionService.getRetentionStats(tenantId, policy);
      res.json(stats);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/orders:
 *   post:
 *     summary: Apply retention policy for orders
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *                 description: Number of days to retain orders
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       403:
 *         description: Forbidden - Only admin can apply retention
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/orders',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const { days = 365 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyOrdersRetention(tenantId, days);
      await logAction(req, 'RETENTION', 'orders', null, { days, deletedCount }, 'SUCCESS');
      res.json({
        message: `Deleted ${deletedCount} orders based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      await logAction(req, 'RETENTION', 'orders', null, { error: (error as Error).message }, 'FAILED', (error as Error).message);
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/transactions:
 *   post:
 *     summary: Apply retention policy for transactions
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 365
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/transactions',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const { days = 365 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyTransactionsRetention(tenantId, days);
      await logAction(req, 'RETENTION', 'transactions', null, { days, deletedCount }, 'SUCCESS');
      res.json({
        message: `Deleted ${deletedCount} transactions based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      await logAction(req, 'RETENTION', 'transactions', null, { error: (error as Error).message }, 'FAILED', (error as Error).message);
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/reports:
 *   post:
 *     summary: Apply retention policy for reports
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 180
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/reports',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const { days = 180 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyReportsRetention(tenantId, days);
      res.json({
        message: `Deleted ${deletedCount} reports based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/audit-logs:
 *   post:
 *     summary: Apply retention policy for audit logs
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 90
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/audit-logs',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const { days = 90 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyAuditLogsRetention(tenantId, days);
      res.json({
        message: `Deleted ${deletedCount} audit logs based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/contact-submissions:
 *   post:
 *     summary: Apply retention policy for contact submissions
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 90
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/contact-submissions',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { days = 90 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyContactSubmissionsRetention(days);
      res.json({
        message: `Deleted ${deletedCount} contact submissions based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/demo-requests:
 *   post:
 *     summary: Apply retention policy for demo requests
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 default: 90
 *     responses:
 *       200:
 *         description: Retention policy applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/demo-requests',
  authGuard,
  validate({ body: applyRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { days = 90 } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const deletedCount = await retentionService.applyDemoRequestsRetention(days);
      res.json({
        message: `Deleted ${deletedCount} demo requests based on retention policy`,
        deletedCount,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

/**
 * @swagger
 * /api/retention/all:
 *   post:
 *     summary: Apply all retention policies
 *     tags: [Retention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policy:
 *                 type: object
 *                 properties:
 *                   orders:
 *                     type: integer
 *                     minimum: 1
 *                   transactions:
 *                     type: integer
 *                     minimum: 1
 *                   reports:
 *                     type: integer
 *                     minimum: 1
 *                   auditLogs:
 *                     type: integer
 *                     minimum: 1
 *                   contactSubmissions:
 *                     type: integer
 *                     minimum: 1
 *                   demoRequests:
 *                     type: integer
 *                     minimum: 1
 *     responses:
 *       200:
 *         description: All retention policies applied successfully
 *       403:
 *         description: Forbidden
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/all',
  authGuard,
  validate({ body: applyAllRetentionSchema }),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const { policy } = req.body;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can apply retention
      if (req.role !== 'ADMIN_TENANT' && req.role !== 'SUPER_ADMIN') {
        res.status(403).json({ message: 'Only tenant admin or super admin can apply retention policies' });
        return;
      }

      const result = await retentionService.applyAllRetentionPolicies(tenantId, policy);
      res.json({
        message: 'Applied all retention policies',
        ...result,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'RETENTION');
    }
  }
);

export default router;

