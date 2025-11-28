/**
 * Push Notification Routes
 * API endpoints for push notification management
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import pushNotificationService from '../services/push-notification.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

const sendPushSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /api/push-notifications/send:
 *   post:
 *     summary: Send push notification (for testing)
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - title
 *               - message
 *             properties:
 *               to:
 *                 type: string | array
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Push notification sent
 */
router.post(
  '/send',
  authGuard,
  subscriptionGuard,
  validate({ body: sendPushSchema }),
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const { to, title, message, data } = req.body;
      const result = await pushNotificationService.sendPush({ to, title, message, data });
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send push notification', 'SEND_PUSH');
    }
  }
);

/**
 * @swagger
 * /api/push-notifications/send-to-users:
 *   post:
 *     summary: Send push notification to multiple users
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - title
 *               - message
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Push notifications sent
 */
router.post(
  '/send-to-users',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      userIds: z.array(z.string()),
      title: z.string().min(1),
      message: z.string().min(1),
      data: z.record(z.any()).optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const { userIds, title, message, data } = req.body;
      const result = await pushNotificationService.sendToUsers(userIds, title, message, data);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send push notifications', 'SEND_PUSH_TO_USERS');
    }
  }
);

export default router;

