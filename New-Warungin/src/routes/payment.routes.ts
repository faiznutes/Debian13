import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import paymentService from '../services/payment.service';
import { requireTenantId } from '../utils/tenant';
import { z } from 'zod';
import { validate } from '../middlewares/validator';
import prisma from '../config/database';

const router = Router();

const createPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'QRIS']),
  qrCode: z.string().optional(), // QR Code string untuk QRIS manual
  qrCodeImage: z.string().url().optional(), // URL gambar QR Code (opsional)
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })),
});

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create payment transaction
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/create',
  authGuard,
  validate({ body: createPaymentSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await paymentService.createPayment(req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create payment' 
      });
    }
  }
);

/**
 * @swagger
 * /api/payment/status/{orderId}:
 *   get:
 *     summary: Check payment status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/status/:orderId',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const result = await paymentService.checkPaymentStatus(req.params.orderId);
      res.json(result);
    } catch (error: any) {
      console.error('Payment status check error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to check payment status' 
      });
    }
  }
);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Handle Midtrans webhook notification (direct from Midtrans)
 *     tags: [Payment]
 */
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    try {
      const result = await paymentService.handleWebhook(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to handle webhook' 
      });
    }
  }
);

/**
 * @swagger
 * /api/payment/webhook/n8n:
 *   post:
 *     summary: Internal endpoint for n8n to process payment webhooks (n8n validates signature first)
 *     tags: [Payment]
 */
router.post(
  '/webhook/n8n',
  async (req: Request, res: Response) => {
    try {
      // n8n already validated the webhook signature
      // Just process the payment directly
      const result = await paymentService.handleWebhook(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('n8n webhook processing error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to process webhook' 
      });
    }
  }
);

/**
 * @swagger
 * /api/payment/cancel/{orderId}:
 *   post:
 *     summary: Cancel payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/cancel/:orderId',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const result = await paymentService.cancelPayment(req.params.orderId);
      res.json(result);
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to cancel payment' 
      });
    }
  }
);

const createAddonPaymentSchema = z.object({
  itemName: z.string().min(1),
  amount: z.number().positive(),
  itemId: z.string().min(1),
  itemType: z.enum(['addon', 'subscription']),
});

/**
 * @swagger
 * /api/payment/addon:
 *   post:
 *     summary: Create Midtrans payment for addon/subscription
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/addon',
  authGuard,
  validate({ body: createAddonPaymentSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const user = (req as any).user;
      
      // Get tenant info with subscription plan
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { 
          name: true, 
          email: true, 
          phone: true,
          subscriptionPlan: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tenant not found' 
        });
      }

      const result = await paymentService.createAddonPayment({
        tenantId,
        tenantName: tenant.name,
        tenantEmail: tenant.email || undefined,
        tenantPhone: tenant.phone || undefined,
        itemName: req.body.itemName,
        amount: req.body.amount,
        itemId: req.body.itemId,
        itemType: req.body.itemType,
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Addon payment creation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create payment' 
      });
    }
  }
);

export default router;

