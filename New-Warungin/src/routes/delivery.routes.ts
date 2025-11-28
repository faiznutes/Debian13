import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import deliveryService from '../services/delivery.service';
import logger from '../utils/logger';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createCourierSchema = z.object({
  courier: z.string().min(1),
  apiKey: z.string().min(1),
});

const processDeliverySchema = z.object({
  trackingNumber: z.string().optional(),
  courier: z.string().optional(),
});

const createShipmentSchema = z.object({
  courier: z.enum(['JNE', 'JNT', 'POS']),
});

const trackShipmentSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.enum(['JNE', 'JNT', 'POS']),
});

/**
 * @swagger
 * /api/delivery/orders:
 *   get:
 *     summary: Get delivery orders
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/orders',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const orders = await deliveryService.getDeliveryOrders(tenantId);
      res.json({ data: orders });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get delivery orders', 'GET_DELIVERY_ORDERS');
    }
  }
);

/**
 * @swagger
 * /api/delivery/orders/{orderId}/process:
 *   post:
 *     summary: Process delivery order
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema: { type: string }
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               courier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery processed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/orders/:orderId/process',
  authGuard,
  validate({ body: processDeliverySchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const order = await deliveryService.processDelivery(tenantId, req.params.orderId, req.body);
      res.json(order);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'DELIVERY');
    }
  }
);

router.post(
  '/couriers',
  authGuard,
  validate({ body: createCourierSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const courier = await deliveryService.setupCourier(tenantId, req.body);
      res.status(201).json(courier);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'DELIVERY');
    }
  }
);

/**
 * @swagger
 * /api/delivery/orders/{orderId}/create-shipment:
 *   post:
 *     summary: Create shipment via courier API
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema: { type: string }
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courier
 *             properties:
 *               courier:
 *                 type: string
 *                 enum: [JNE, JNT, POS]
 *                 description: Courier service name
 *     responses:
 *       201:
 *         description: Shipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trackingNumber:
 *                   type: string
 *                 courier:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/orders/:orderId/create-shipment',
  authGuard,
  validate({ body: createShipmentSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await deliveryService.createShipment(
        tenantId,
        req.params.orderId,
        req.body.courier
      );
      res.status(201).json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'DELIVERY');
    }
  }
);

/**
 * @swagger
 * /api/delivery/track:
 *   post:
 *     summary: Track shipment via courier API
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumber
 *               - courier
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: Tracking number from courier
 *               courier:
 *                 type: string
 *                 enum: [JNE, JNT, POS]
 *                 description: Courier service name
 *     responses:
 *       200:
 *         description: Tracking information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trackingNumber:
 *                   type: string
 *                 status:
 *                   type: string
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/track',
  authGuard,
  validate({ body: trackShipmentSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const tracking = await deliveryService.trackShipment(
        tenantId,
        req.body.trackingNumber,
        req.body.courier
      );
      res.json(tracking);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'DELIVERY');
    }
  }
);

/**
 * @swagger
 * /api/delivery/webhook/{courier}:
 *   post:
 *     summary: Webhook endpoint for courier status updates
 *     description: Receives webhooks from courier services (JNE, J&T, POS) to update order status
 *     tags: [Delivery]
 *     parameters:
 *       - in: path
 *         name: courier
 *         schema: { type: string }
 *         required: true
 *         description: Courier service name (JNE, JNT, or POS)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               status:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Webhook received
 */
router.post(
  '/webhook/:courier',
  async (req: Request, res: Response) => {
    try {
      const { courier } = req.params;
      const webhookData = req.body;

      // Verify webhook signature if provided
      // In production, verify webhook signature from courier service
      
      // Process webhook data
      await deliveryService.processCourierWebhook(courier, webhookData);

      // Return 200 immediately to acknowledge receipt
      res.status(200).json({ message: 'Webhook received' });
    } catch (error: any) {
      // Still return 200 to prevent courier from retrying
      // Log error for investigation
      logger.error('Courier webhook error:', error);
      res.status(200).json({ message: 'Webhook received but processing failed' });
    }
  }
);

export default router;

