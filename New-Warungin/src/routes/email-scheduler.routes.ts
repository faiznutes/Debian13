/**
 * Email Scheduler Routes
 * API endpoints for scheduling email campaigns
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import emailSchedulerService from '../services/email-scheduler.service';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const scheduleCampaignSchema = z.object({
  campaignId: z.string(),
  scheduledAt: z.string().datetime(),
  target: z.enum(['ALL', 'MEMBERS', 'ACTIVE', 'INACTIVE']),
  subject: z.string().min(1),
  content: z.string().min(1),
  templateId: z.string().optional(),
});

const updateScheduleSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'SENT', 'CANCELLED']).optional(),
});

/**
 * @swagger
 * /api/email-scheduler:
 *   get:
 *     summary: Get all scheduled email campaigns
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, CANCELLED, FAILED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of scheduled campaigns
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
      const status = req.query.status as string | undefined;
      const schedules = await emailSchedulerService.getScheduledCampaigns(tenantId, status);
      res.json(schedules);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_SCHEDULER');
    }
  }
);

/**
 * @swagger
 * /api/email-scheduler/upcoming:
 *   get:
 *     summary: Get upcoming scheduled campaigns
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of upcoming campaigns to return
 *     responses:
 *       200:
 *         description: List of upcoming campaigns
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/upcoming',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const limit = parseInt(req.query.limit as string) || 10;
      const schedules = await emailSchedulerService.getUpcomingCampaigns(tenantId, limit);
      res.json(schedules);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_SCHEDULER');
    }
  }
);

/**
 * @swagger
 * /api/email-scheduler/{id}:
 *   get:
 *     summary: Get scheduled campaign by ID
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Scheduled campaign details
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
      const schedule = await emailSchedulerService.getScheduledCampaignById(req.params.id, tenantId);
      res.json(schedule);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_SCHEDULER');
    }
  }
);

/**
 * @swagger
 * /api/email-scheduler:
 *   post:
 *     summary: Schedule an email campaign
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - scheduledAt
 *               - target
 *               - subject
 *               - content
 *             properties:
 *               campaignId:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T10:00:00Z"
 *               target:
 *                 type: string
 *                 enum: [ALL, MEMBERS, ACTIVE, INACTIVE]
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               templateId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign scheduled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: scheduleCampaignSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const schedule = await emailSchedulerService.scheduleCampaign(tenantId, {
        ...req.body,
        scheduledAt: new Date(req.body.scheduledAt),
      });
      res.status(201).json(schedule);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to schedule campaign', 'SCHEDULE_CAMPAIGN');
    }
  }
);

/**
 * @swagger
 * /api/email-scheduler/{id}:
 *   put:
 *     summary: Update scheduled campaign
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, CANCELLED]
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updateScheduleSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const updateData: any = {};
      if (req.body.scheduledAt) {
        updateData.scheduledAt = new Date(req.body.scheduledAt);
      }
      if (req.body.status) {
        updateData.status = req.body.status;
      }
      const schedule = await emailSchedulerService.updateSchedule(req.params.id, tenantId, updateData);
      res.json(schedule);
    } catch (error: any) {
      if (error.message === 'Scheduled campaign not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/email-scheduler/{id}/cancel:
 *   post:
 *     summary: Cancel scheduled campaign
 *     tags: [Email Scheduler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Campaign cancelled successfully
 *       400:
 *         description: Cannot cancel already sent campaign
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/:id/cancel',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const schedule = await emailSchedulerService.cancelSchedule(req.params.id, tenantId);
      res.json(schedule);
    } catch (error: any) {
      if (error.message === 'Scheduled campaign not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;

