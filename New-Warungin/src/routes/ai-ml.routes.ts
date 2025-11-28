/**
 * AI/ML Routes
 * API endpoints for AI/ML features
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import aiMlService from '../services/ai-ml.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/ai-ml/forecast-sales:
 *   get:
 *     summary: Get sales forecast
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/forecast-sales',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      const forecast = await aiMlService.forecastSales(tenantId, months);
      res.json(forecast);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to forecast sales', 'FORECAST_SALES');
    }
  }
);

/**
 * @swagger
 * /api/ai-ml/recommendations:
 *   get:
 *     summary: Get product recommendations
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/recommendations',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const customerId = req.query.customerId as string | undefined;
      const productId = req.query.productId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recommendations = await aiMlService.getProductRecommendations(tenantId, customerId, productId, limit);
      res.json(recommendations);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get recommendations', 'GET_RECOMMENDATIONS');
    }
  }
);

/**
 * @swagger
 * /api/ai-ml/customer-segments:
 *   get:
 *     summary: Get customer segments
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/customer-segments',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const segments = await aiMlService.segmentCustomers(tenantId);
      res.json(segments);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to segment customers', 'SEGMENT_CUSTOMERS');
    }
  }
);

/**
 * @swagger
 * /api/ai-ml/optimize-price:
 *   post:
 *     summary: Optimize product price
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/optimize-price',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }
      const optimization = await aiMlService.optimizePrice(tenantId, productId);
      res.json(optimization);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to optimize price', 'OPTIMIZE_PRICE');
    }
  }
);

export default router;

