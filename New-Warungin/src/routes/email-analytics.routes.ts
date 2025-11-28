/**
 * Email Analytics Routes
 * API endpoints for email analytics and tracking
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import emailAnalyticsService from '../services/email-analytics.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const trackEventSchema = z.object({
  campaignId: z.string().optional(),
  email: z.string().email(),
  eventType: z.enum(['SENT', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED']),
  linkUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /api/email-analytics/track:
 *   post:
 *     summary: Track email event (sent, opened, clicked, etc.)
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - eventType
 *             properties:
 *               campaignId:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               eventType:
 *                 type: string
 *                 enum: [SENT, OPENED, CLICKED, BOUNCED, UNSUBSCRIBED]
 *               linkUrl:
 *                 type: string
 *                 format: uri
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event tracked successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/track',
  authGuard,
  subscriptionGuard,
  validate({ body: trackEventSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const event = await emailAnalyticsService.trackEvent(tenantId, req.body);
      res.status(201).json(event);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to track event', 'TRACK_EVENT');
    }
  }
);

/**
 * @swagger
 * /api/email-analytics/campaign/{campaignId}:
 *   get:
 *     summary: Get campaign email analytics
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaignId:
 *                   type: string
 *                 sent:
 *                   type: integer
 *                 opened:
 *                   type: integer
 *                 clicked:
 *                   type: integer
 *                 uniqueOpens:
 *                   type: integer
 *                 uniqueClicks:
 *                   type: integer
 *                 openRate:
 *                   type: number
 *                 clickRate:
 *                   type: number
 *                 uniqueOpenRate:
 *                   type: number
 *                 uniqueClickRate:
 *                   type: number
 *                 bounceRate:
 *                   type: number
 *                 unsubscribeRate:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/campaign/:campaignId',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const analytics = await emailAnalyticsService.getCampaignAnalytics(tenantId, req.params.campaignId);
      res.json(analytics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get analytics', 'EMAIL_ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/email-analytics/overall:
 *   get:
 *     summary: Get overall email analytics for tenant
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Overall analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sent:
 *                   type: integer
 *                 opened:
 *                   type: integer
 *                 clicked:
 *                   type: integer
 *                 uniqueOpens:
 *                   type: integer
 *                 uniqueClicks:
 *                   type: integer
 *                 openRate:
 *                   type: number
 *                 clickRate:
 *                   type: number
 *                 uniqueOpenRate:
 *                   type: number
 *                 uniqueClickRate:
 *                   type: number
 *                 bounceRate:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/overall',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const analytics = await emailAnalyticsService.getOverallAnalytics(tenantId, startDate, endDate);
      res.json(analytics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get analytics', 'EMAIL_ANALYTICS');
    }
  }
);

/**
 * @swagger
 * /api/email-analytics/track-open/{campaignId}:
 *   get:
 *     summary: Track email open (via tracking pixel)
 *     tags: [Email Analytics]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Recipient email
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Returns 1x1 transparent pixel
 *         content:
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/track-open/:campaignId',
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const email = req.query.email as string;
      const tenantId = req.query.tenantId as string;

      if (!email || !tenantId) {
        return res.status(400).json({ message: 'Email and tenantId are required' });
      }

      await emailAnalyticsService.trackOpen(campaignId, email, tenantId);

      // Return 1x1 transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.send(pixel);
    } catch (error: any) {
      // Still return pixel even if tracking fails
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.send(pixel);
    }
  }
);

/**
 * @swagger
 * /api/email-analytics/track-click/{campaignId}:
 *   get:
 *     summary: Track email click and redirect
 *     tags: [Email Analytics]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Recipient email
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: Target URL to redirect to
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       302:
 *         description: Redirects to target URL
 */
router.get(
  '/track-click/:campaignId',
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const email = req.query.email as string;
      const url = req.query.url as string;
      const tenantId = req.query.tenantId as string;

      if (!email || !url || !tenantId) {
        return res.status(400).json({ message: 'Email, url, and tenantId are required' });
      }

      await emailAnalyticsService.trackClick(campaignId, email, url, tenantId);

      // Redirect to target URL
      res.redirect(url);
    } catch (error: any) {
      // Still redirect even if tracking fails
      const url = req.query.url as string;
      if (url) {
        res.redirect(url);
      } else {
        res.status(400).json({ message: 'Invalid URL' });
      }
    }
  }
);

export default router;

