import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import marketingService from '../services/marketing.service';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'PROMO']),
  target: z.enum(['ALL', 'MEMBERS', 'ACTIVE', 'INACTIVE']),
  content: z.string().min(1),
  promoCode: z.string().optional(),
  subject: z.string().optional(), // For email campaigns
});

const createPromoSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  code: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

router.get(
  '/campaigns',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const campaigns = await marketingService.getCampaigns(tenantId);
      res.json({ data: campaigns });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Create new marketing campaign
 *     tags: [Marketing]
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
 *               - type
 *               - target
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 example: Summer Sale Campaign
 *               type:
 *                 type: string
 *                 enum: [SMS, EMAIL, WHATSAPP, PROMO]
 *               target:
 *                 type: string
 *                 enum: [ALL, MEMBERS, ACTIVE, INACTIVE]
 *               content:
 *                 type: string
 *               subject:
 *                 type: string
 *                 description: Required for EMAIL campaigns
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/campaigns',
  authGuard,
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const campaign = await marketingService.createCampaign(tenantId, req.body);
      res.status(201).json(campaign);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

router.post(
  '/campaigns/:campaignId/send',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      // In production, fetch campaign from database
      // For now, accept campaign data in request body for EMAIL campaigns
      const campaignData = req.body.campaignData;
      const result = await marketingService.sendCampaign(
        tenantId, 
        req.params.campaignId,
        campaignData
      );
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

// Direct email campaign send endpoint (for immediate sending)
router.post(
  '/campaigns/send-email',
  authGuard,
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      if (req.body.type !== 'EMAIL') {
        return res.status(400).json({ message: 'This endpoint is only for EMAIL campaigns' });
      }
      
      const result = await marketingService.sendEmailCampaign(tenantId, {
        name: req.body.name,
        content: req.body.content,
        subject: req.body.subject || req.body.name,
        target: req.body.target,
      });
      
      res.json({
        message: 'Email campaign sent successfully',
        sent: result.sent,
        failed: result.failed,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

// Direct SMS campaign send endpoint
router.post(
  '/campaigns/send-sms',
  authGuard,
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      if (req.body.type !== 'SMS' && req.body.type !== 'WHATSAPP') {
        return res.status(400).json({ message: 'This endpoint is only for SMS/WhatsApp campaigns' });
      }
      
      const result = await marketingService.sendSMSCampaign(tenantId, {
        name: req.body.name,
        content: req.body.content,
        target: req.body.target,
      });
      
      res.json({
        message: 'SMS campaign sent successfully',
        sent: result.sent,
        failed: result.failed,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

// Direct push notification campaign send endpoint
router.post(
  '/campaigns/send-push',
  authGuard,
  validate({ body: createCampaignSchema.extend({ title: z.string().optional() }) }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      
      const result = await marketingService.sendPushNotificationCampaign(tenantId, {
        name: req.body.name,
        content: req.body.content,
        target: req.body.target,
        title: req.body.title || req.body.name,
      });
      
      res.json({
        message: 'Push notification campaign sent successfully',
        sent: result.sent,
        failed: result.failed,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

router.post(
  '/promos',
  authGuard,
  validate({ body: createPromoSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const promo = await marketingService.createPromo(tenantId, req.body);
      res.status(201).json(promo);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

/**
 * @swagger
 * /api/marketing/analytics:
 *   get:
 *     summary: Get campaign analytics
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema: { type: string }
 *         description: Optional campaign ID for specific campaign analytics
 *     responses:
 *       200:
 *         description: Campaign analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCampaigns:
 *                   type: integer
 *                 totalSent:
 *                   type: integer
 *                 totalOpens:
 *                   type: integer
 *                 totalClicks:
 *                   type: integer
 *                 averageOpenRate:
 *                   type: number
 *                 averageClickRate:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/analytics',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const campaignId = req.query.campaignId as string | undefined;
      const analytics = await marketingService.getCampaignAnalytics(tenantId, campaignId);
      res.json(analytics);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

/**
 * @swagger
 * /api/marketing/campaigns/{campaignId}/roi:
 *   get:
 *     summary: Calculate campaign ROI
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         schema: { type: string }
 *         required: true
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign ROI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaignId:
 *                   type: string
 *                 roi:
 *                   type: number
 *                   description: ROI percentage
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/campaigns/:campaignId/roi',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const roi = await marketingService.calculateCampaignROI(tenantId, req.params.campaignId);
      res.json({
        campaignId: req.params.campaignId,
        roi: Math.round(roi * 100) / 100,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'MARKETING');
    }
  }
);

export default router;

