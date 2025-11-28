/**
 * Stock Transfer Routes
 * API endpoints for managing stock transfers between outlets
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { validate } from '../middlewares/validator';
import { requireTenantId, requireUserId } from '../utils/tenant';
import stockTransferService from '../services/stock-transfer.service';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createStockTransferSchema = z.object({
  fromOutletId: z.string(),
  toOutletId: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
});

/**
 * @swagger
 * /api/stock-transfers:
 *   get:
 *     summary: Get all stock transfers
 *     tags: [Stock Transfers]
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
 *         name: outletId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of stock transfers
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
        outletId: req.query.outletId as string | undefined,
      };
      const result = await stockTransferService.getStockTransfers(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get stock transfers', 'GET_STOCK_TRANSFERS');
    }
  }
);

/**
 * @swagger
 * /api/stock-transfers/{id}:
 *   get:
 *     summary: Get stock transfer by ID
 *     tags: [Stock Transfers]
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
 *         description: Stock transfer details
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const transfer = await stockTransferService.getStockTransferById(req.params.id, tenantId);
      res.json(transfer);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get stock transfer', 'GET_STOCK_TRANSFER');
    }
  }
);

/**
 * @swagger
 * /api/stock-transfers:
 *   post:
 *     summary: Create new stock transfer
 *     tags: [Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromOutletId
 *               - toOutletId
 *               - items
 *             properties:
 *               fromOutletId:
 *                 type: string
 *               toOutletId:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Stock transfer created
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createStockTransferSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      const transfer = await stockTransferService.createStockTransfer(
        tenantId,
        userId,
        req.body
      );
      res.status(201).json(transfer);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create stock transfer', 'CREATE_STOCK_TRANSFER');
    }
  }
);

/**
 * @swagger
 * /api/stock-transfers/{id}/receive:
 *   post:
 *     summary: Receive stock transfer (update stock)
 *     tags: [Stock Transfers]
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
 *         description: Stock transfer received
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
      const transfer = await stockTransferService.receiveStockTransfer(
        req.params.id,
        tenantId,
        userId,
        receivedDate
      );
      res.json(transfer);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to receive stock transfer', 'RECEIVE_STOCK_TRANSFER');
    }
  }
);

/**
 * @swagger
 * /api/stock-transfers/{id}/cancel:
 *   post:
 *     summary: Cancel stock transfer
 *     tags: [Stock Transfers]
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
 *         description: Stock transfer cancelled
 */
router.post(
  '/:id/cancel',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const transfer = await stockTransferService.cancelStockTransfer(req.params.id, tenantId);
      res.json(transfer);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to cancel stock transfer', 'CANCEL_STOCK_TRANSFER');
    }
  }
);

export default router;

