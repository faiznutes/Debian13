import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import auditLogService from '../services/audit-log.service';
import { requireTenantId } from '../utils/tenant';
import { AuthRequest } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

const getAuditLogsQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('50'),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = getAuditLogsQuerySchema.parse(req.query);
      
      // Only SUPER_ADMIN can view all tenant logs, others only their own
      const result = await auditLogService.getLogs({
        tenantId: req.role === 'SUPER_ADMIN' ? query.userId ? undefined : tenantId : tenantId,
        userId: query.userId,
        action: query.action,
        resource: query.resource,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page: query.page,
        limit: query.limit,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const log = await auditLogService.getLogById(req.params.id, tenantId);
      
      if (!log) {
        return res.status(404).json({ message: 'Audit log not found' });
      }
      
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

