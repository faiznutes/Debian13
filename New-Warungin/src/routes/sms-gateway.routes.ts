/**
 * SMS Gateway Routes
 * API endpoints for SMS gateway management
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import smsGatewayService from '../services/sms-gateway.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/sms-gateway/balance:
 *   get:
 *     summary: Get SMS gateway balance/credits
 *     tags: [SMS Gateway]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SMS balance information
 */
router.get(
  '/balance',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req); // Verify authentication
      const balance = await smsGatewayService.getBalance();
      res.json(balance);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get SMS balance', 'GET_SMS_BALANCE');
    }
  }
);

/**
 * @swagger
 * /api/sms-gateway/send:
 *   post:
 *     summary: Send SMS (for testing)
 *     tags: [SMS Gateway]
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
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent
 */
router.post(
  '/send',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: 'to and message are required' });
      }
      const result = await smsGatewayService.sendSMS({ to, message });
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send SMS', 'SEND_SMS');
    }
  }
);

/**
 * @swagger
 * /api/sms-gateway/status/{messageId}:
 *   get:
 *     summary: Check SMS delivery status
 *     tags: [SMS Gateway]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SMS delivery status
 */
router.get(
  '/status/:messageId',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const status = await smsGatewayService.checkDeliveryStatus(req.params.messageId);
      res.json(status);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to check SMS status', 'CHECK_SMS_STATUS');
    }
  }
);

export default router;

