/**
 * Customer Engagement Routes
 * API endpoints for customer engagement metrics
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import customerEngagementService from '../services/customer-engagement.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/customer-engagement/{customerId}:
 *   get:
 *     summary: Get customer engagement metrics
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *                 totalOrders:
 *                   type: integer
 *                 totalSpent:
 *                   type: number
 *                 averageOrderValue:
 *                   type: number
 *                 engagementScore:
 *                   type: number
 *                   description: Engagement score (0-100)
 *                 engagementLevel:
 *                   type: string
 *                   enum: [HIGH, MEDIUM, LOW, INACTIVE]
 *                 emailOpenRate:
 *                   type: number
 *                 emailClickRate:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/:customerId',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const metrics = await customerEngagementService.getCustomerEngagement(
        tenantId,
        req.params.customerId
      );
      res.json(metrics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get customer engagement', 'GET_CUSTOMER_ENGAGEMENT');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement:
 *   get:
 *     summary: Get engagement metrics for all customers
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: List of customer engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const metrics = await customerEngagementService.getAllCustomersEngagement(tenantId, limit);
      res.json(metrics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get customer engagement', 'GET_CUSTOMER_ENGAGEMENT');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/level/{level}:
 *   get:
 *     summary: Get customers by engagement level
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW, INACTIVE]
 *         description: Engagement level
 *     responses:
 *       200:
 *         description: List of customers with specified engagement level
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/level/:level',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const level = req.params.level as 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE';
      const metrics = await customerEngagementService.getCustomersByEngagementLevel(tenantId, level);
      res.json(metrics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get customer engagement', 'GET_CUSTOMER_ENGAGEMENT');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/stats/overall:
 *   get:
 *     summary: Get overall engagement statistics
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall engagement statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCustomers:
 *                   type: integer
 *                 high:
 *                   type: integer
 *                 medium:
 *                   type: integer
 *                 low:
 *                   type: integer
 *                 inactive:
 *                   type: integer
 *                 averageEngagementScore:
 *                   type: number
 *                 distribution:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: number
 *                     medium:
 *                       type: number
 *                     low:
 *                       type: number
 *                     inactive:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/stats/overall',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const stats = await customerEngagementService.getOverallEngagementStats(tenantId);
      res.json(stats);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get customer engagement', 'GET_CUSTOMER_ENGAGEMENT');
    }
  }
);

export default router;

