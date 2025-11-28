/**
 * Advanced Audit Routes
 * API endpoints for audit log management and querying
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import advancedAuditService from '../services/advanced-audit.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/advanced-audit/logs:
 *   get:
 *     summary: Query audit logs
 *     tags: [Advanced Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/logs',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        tenantId,
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        resource: req.query.resource as string | undefined,
        severity: req.query.severity as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await advancedAuditService.queryAuditLogs(query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to query audit logs', 'QUERY_AUDIT_LOGS');
    }
  }
);

/**
 * @swagger
 * /api/advanced-audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Advanced Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/statistics',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const dateRange = req.query.startDate && req.query.endDate ? {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
      } : undefined;
      const stats = await advancedAuditService.getAuditStatistics(tenantId, dateRange);
      res.json(stats);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get audit statistics', 'GET_AUDIT_STATISTICS');
    }
  }
);

/**
 * @swagger
 * /api/advanced-audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Advanced Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        resource: req.query.resource as string | undefined,
        severity: req.query.severity as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const format = (req.query.format as 'CSV' | 'JSON') || 'CSV';
      const exportData = await advancedAuditService.exportAuditLogs(tenantId, query, format);
      
      res.setHeader('Content-Type', format === 'CSV' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.${format.toLowerCase()}`);
      res.send(exportData);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to export audit logs', 'EXPORT_AUDIT_LOGS');
    }
  }
);

export default router;

