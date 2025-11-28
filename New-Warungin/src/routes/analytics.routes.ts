import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import analyticsService from '../services/analytics.service';
import { checkBusinessAnalyticsAddon } from '../middlewares/addon-guard';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createCustomReportSchema = z.object({
  name: z.string().min(1),
  dataType: z.enum(['SALES', 'PRODUCTS', 'CUSTOMERS', 'INVENTORY']),
  metrics: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * @swagger
 * /api/analytics/predictions:
 *   get:
 *     summary: Get sales predictions
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [moving_average, linear_regression]
 *           default: moving_average
 *         description: Prediction method
 *     responses:
 *       200:
 *         description: Sales predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 predictedRevenue:
 *                   type: number
 *                 confidence:
 *                   type: number
 *                 period:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.get(
  '/predictions',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      
      // For Super Admin, return platform revenue predictions (subscriptions & addons)
      if (userRole === 'SUPER_ADMIN') {
        const method = (req.query.method as 'moving_average' | 'linear_regression') || 'moving_average';
        const predictions = await analyticsService.getPlatformPredictions(method);
        return res.json(predictions);
      }
      
      const tenantId = requireTenantId(req);
      const method = (req.query.method as 'moving_average' | 'linear_regression') || 'moving_average';
      const predictions = await analyticsService.getPredictions(tenantId, method);
      res.json(predictions);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/analytics/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top products to return
 *     responses:
 *       200:
 *         description: Top selling products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product:
 *                     type: object
 *                   totalQuantity:
 *                     type: integer
 *                   totalRevenue:
 *                     type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.get(
  '/top-products',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      
      // For Super Admin, return top addons (platform revenue)
      if (userRole === 'SUPER_ADMIN') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const topAddons = await analyticsService.getTopAddons(limit);
        return res.json(topAddons);
      }
      
      const tenantId = requireTenantId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const products = await analyticsService.getTopProducts(tenantId, limit);
      res.json(products);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get sales trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Time period for trends
 *     responses:
 *       200:
 *         description: Sales trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       revenue:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.get(
  '/trends',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      
      // For Super Admin, return platform revenue trends (subscriptions & addons)
      if (userRole === 'SUPER_ADMIN') {
        const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
        const trends = await analyticsService.getPlatformTrends(period);
        return res.json(trends);
      }
      
      const tenantId = requireTenantId(req);
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
      const trends = await analyticsService.getTrends(tenantId, period);
      res.json(trends);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/analytics/custom-reports:
 *   get:
 *     summary: Get all custom reports
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of custom reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.get(
  '/custom-reports',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const reports = await analyticsService.getCustomReports(tenantId);
      res.json({ data: reports });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/analytics/custom-reports:
 *   post:
 *     summary: Create a custom report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dataType
 *               - metrics
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               dataType:
 *                 type: string
 *                 enum: [SALES, PRODUCTS, CUSTOMERS, INVENTORY]
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Custom report created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.post(
  '/custom-reports',
  authGuard,
  checkBusinessAnalyticsAddon,
  validate({ body: createCustomReportSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const report = await analyticsService.createCustomReport(tenantId, req.body);
      res.status(201).json(report);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

router.get(
  '/custom-reports/:reportId/export',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const report = await analyticsService.exportCustomReport(tenantId, req.params.reportId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.reportId}.xlsx`);
      res.send(report);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'ANALYTICS');
    }
  }
);

export default router;

