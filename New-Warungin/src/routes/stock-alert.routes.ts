/**
 * Stock Alert Routes
 * API endpoints for stock alerts and notifications
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import stockAlertService from '../services/stock-alert.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/stock-alerts/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Stock Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products
 */
router.get(
  '/low-stock',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const products = await stockAlertService.getLowStockProducts(tenantId);
      res.json(products);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get low stock products', 'GET_LOW_STOCK');
    }
  }
);

/**
 * @swagger
 * /api/stock-alerts/stats:
 *   get:
 *     summary: Get stock alert statistics
 *     tags: [Stock Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock alert statistics
 */
router.get(
  '/stats',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const stats = await stockAlertService.getStockAlertStats(tenantId);
      res.json(stats);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get stock alert stats', 'GET_STOCK_ALERT_STATS');
    }
  }
);

/**
 * @swagger
 * /api/stock-alerts/send:
 *   post:
 *     summary: Check and send stock alerts
 *     tags: [Stock Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock alerts sent
 */
router.post(
  '/send',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await stockAlertService.checkAndSendStockAlerts(tenantId);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send stock alerts', 'SEND_STOCK_ALERTS');
    }
  }
);

export default router;

