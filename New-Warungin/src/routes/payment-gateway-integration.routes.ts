/**
 * Payment Gateway Integration Routes
 * API endpoints for payment gateway integrations (OVO, DANA, LinkAja)
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import paymentGatewayService from '../services/payment-gateway-integration.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @swagger
 * /api/payment-gateway/create-payment:
 *   post:
 *     summary: Create payment via payment gateway
 *     tags: [Payment Gateway Integration]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/create-payment',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      provider: z.enum(['OVO', 'DANA', 'LINKAJA']),
      amount: z.number().positive(),
      orderId: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      description: z.string().optional(),
      callbackUrl: z.string().optional(),
      config: z.object({
        merchantId: z.string(),
        apiKey: z.string(),
        apiSecret: z.string(),
      }),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const { provider, amount, orderId, customerPhone, customerEmail, description, callbackUrl, config } = req.body;

      let result;
      switch (provider) {
        case 'OVO':
          result = await paymentGatewayService.createOVOPayment({ provider, ...config }, {
            amount,
            orderId,
            customerPhone,
            customerEmail,
            description,
            callbackUrl,
          });
          break;
        case 'DANA':
          result = await paymentGatewayService.createDANAPayment({ provider, ...config }, {
            amount,
            orderId,
            customerPhone,
            customerEmail,
            description,
            callbackUrl,
          });
          break;
        case 'LINKAJA':
          result = await paymentGatewayService.createLinkAjaPayment({ provider, ...config }, {
            amount,
            orderId,
            customerPhone,
            customerEmail,
            description,
            callbackUrl,
          });
          break;
        default:
          return res.status(400).json({ error: 'Unsupported provider' });
      }

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create payment', 'CREATE_PAYMENT_GATEWAY');
    }
  }
);

/**
 * @swagger
 * /api/payment-gateway/check-status:
 *   get:
 *     summary: Check payment status
 *     tags: [Payment Gateway Integration]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/check-status',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      requireTenantId(req);
      const provider = req.query.provider as 'OVO' | 'DANA' | 'LINKAJA';
      const paymentId = req.query.paymentId as string;
      const config = {
        provider,
        merchantId: req.query.merchantId as string,
        apiKey: req.query.apiKey as string,
        apiSecret: req.query.apiSecret as string,
      };

      if (!paymentId) {
        return res.status(400).json({ error: 'paymentId is required' });
      }

      const status = await paymentGatewayService.checkPaymentStatus(config, paymentId);
      res.json(status);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to check payment status', 'CHECK_PAYMENT_STATUS');
    }
  }
);

export default router;

