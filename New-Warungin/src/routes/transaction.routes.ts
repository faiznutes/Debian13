import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import transactionService from '../services/transaction.service';
import { requireTenantId } from '../utils/tenant';
import { z } from 'zod';
import { validate } from '../middlewares/validator';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createTransactionSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'QRIS', 'BANK_TRANSFER', 'SHOPEEPAY', 'DANA', 'CARD', 'E_WALLET']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  reference: z.string().optional(),
  qrCode: z.string().optional(), // QR Code string untuk QRIS manual
  qrCodeImage: z.string().url().optional(), // URL gambar QR Code (opsional)
  notes: z.string().optional(),
  servedBy: z.string().optional(), // Nama kasir/admin yang melayani
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, QRIS, BANK_TRANSFER, SHOPEEPAY, DANA, CARD, E_WALLET]
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *               reference:
 *                 type: string
 *               qrCode:
 *                 type: string
 *               qrCodeImage:
 *                 type: string
 *                 format: uri
 *               notes:
 *                 type: string
 *               servedBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createTransactionSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = (req as any).user.id;
      
      const transaction = await transactionService.createTransaction(
        req.body,
        userId,
        tenantId
      );
      
      res.status(201).json(transaction);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create transaction', 'CREATE_TRANSACTION');
    }
  }
);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await transactionService.getTransactions(tenantId, page, limit);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch transactions', 'GET_TRANSACTIONS');
    }
  }
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const transaction = await transactionService.getTransactionById(req.params.id, tenantId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch transaction', 'GET_TRANSACTION');
    }
  }
);

export default router;

