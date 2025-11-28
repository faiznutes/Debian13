import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import webhookService from '../services/webhook.service';
import { z } from 'zod';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import logger from '../utils/logger';
import prisma from '../config/database';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createWebhookSchema = z.object({
  url: z.string().url('URL tidak valid'),
  events: z.array(z.string()).min(1, 'Minimal 1 event harus dipilih'),
  isActive: z.boolean().optional(),
  retryCount: z.number().int().min(1).max(10).optional(),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

const updateWebhookSchema = createWebhookSchema.partial();

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get all webhooks for tenant
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const includeInactive = req.query.includeInactive === 'true';
      const webhooks = await webhookService.getWebhooks(tenantId, includeInactive);

      res.json({ webhooks });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get webhooks', 'GET_WEBHOOKS');
    }
  }
);

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Create new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authGuard,
  validate({ body: createWebhookSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const data = req.body;

      const webhook = await webhookService.createWebhook(tenantId, data);

      res.status(201).json({ webhook });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create webhook', 'CREATE_WEBHOOK');
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     summary: Update webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authGuard,
  validate({ body: updateWebhookSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { id } = req.params;
      const data = req.body;

      const webhook = await webhookService.updateWebhook(id, tenantId, data);

      res.json({ webhook });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to update webhook', 'UPDATE_WEBHOOK');
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Delete webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { id } = req.params;

      await webhookService.deleteWebhook(id, tenantId);

      res.json({ message: 'Webhook berhasil dihapus' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to delete webhook', 'DELETE_WEBHOOK');
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}/deliveries:
 *   get:
 *     summary: Get webhook deliveries
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/deliveries',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string | undefined;

      const result = await webhookService.getDeliveries(id, page, limit, status);

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get webhook deliveries', 'GET_WEBHOOK_DELIVERIES');
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}/test:
 *   post:
 *     summary: Test webhook delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/test',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { id } = req.params;
      const customPayload = req.body.payload; // Optional custom payload

      // Get webhook to verify it exists and belongs to tenant
      const webhook = await prisma.webhook.findFirst({
        where: { id, tenantId },
      });

      if (!webhook) {
        return res.status(404).json({ message: 'Webhook not found' });
      }

      // Use custom payload if provided, otherwise use default test payload
      const payload = customPayload || {
        test: true,
        message: 'This is a test webhook',
        timestamp: new Date().toISOString(),
        webhookId: id,
      };

      // Trigger test webhook with sample payload (target specific webhook)
      await webhookService.triggerWebhook(tenantId, req.body.event || 'test.event', payload, id);

      res.json({ message: 'Test webhook triggered successfully' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to test webhook', 'TEST_WEBHOOK');
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}/replay/{deliveryId}:
 *   post:
 *     summary: Replay failed webhook delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/replay/:deliveryId',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { id, deliveryId } = req.params;

      await webhookService.replayDelivery(id, deliveryId, tenantId);

      res.json({ message: 'Webhook delivery replayed successfully' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to replay webhook delivery', 'REPLAY_WEBHOOK');
    }
  }
);

export default router;

