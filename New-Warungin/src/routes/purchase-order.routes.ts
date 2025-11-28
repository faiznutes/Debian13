/**
 * Purchase Order Routes
 * API endpoints for managing purchase orders
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { validate } from '../middlewares/validator';
import { requireTenantId, requireUserId } from '../utils/tenant';
import purchaseOrderService from '../services/purchase-order.service';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createPurchaseOrderSchema = z.object({
  supplierId: z.string(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

const updatePurchaseOrderSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
  expectedDate: z.string().datetime().optional(),
  receivedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    receivedQuantity: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  })).optional(),
});

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of purchase orders
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as string | undefined,
        supplierId: req.query.supplierId as string | undefined,
      };
      const result = await purchaseOrderService.getPurchaseOrders(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get purchase orders', 'GET_PURCHASE_ORDERS');
    }
  }
);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order details
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(req.params.id, tenantId);
      res.json(purchaseOrder);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get purchase order', 'GET_PURCHASE_ORDER');
    }
  }
);

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create new purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - items
 *             properties:
 *               supplierId:
 *                 type: string
 *               expectedDate:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Purchase order created
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createPurchaseOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
        tenantId,
        userId,
        req.body
      );
      res.status(201).json(purchaseOrder);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create purchase order', 'CREATE_PURCHASE_ORDER');
    }
  }
);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Purchase order updated
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updatePurchaseOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(
        req.params.id,
        tenantId,
        userId,
        req.body
      );
      res.json(purchaseOrder);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to update purchase order', 'UPDATE_PURCHASE_ORDER');
    }
  }
);

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     summary: Receive purchase order (update stock)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receivedDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase order received
 */
router.post(
  '/:id/receive',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      const receivedDate = req.body.receivedDate ? new Date(req.body.receivedDate) : undefined;
      const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(
        req.params.id,
        tenantId,
        userId,
        receivedDate
      );
      res.json(purchaseOrder);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to receive purchase order', 'RECEIVE_PURCHASE_ORDER');
    }
  }
);

/**
 * @swagger
 * /api/purchase-orders/{id}/cancel:
 *   post:
 *     summary: Cancel purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order cancelled
 */
router.post(
  '/:id/cancel',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(req.params.id, tenantId);
      res.json(purchaseOrder);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to cancel purchase order', 'CANCEL_PURCHASE_ORDER');
    }
  }
);

export default router;

