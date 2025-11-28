/**
 * Customer Engagement Enhancement Routes
 * API endpoints for birthday reminders, promo automation, feedback system
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import customerEngagementService from '../services/customer-engagement-enhancement.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

const submitFeedbackSchema = z.object({
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

/**
 * @swagger
 * /api/customer-engagement/birthdays:
 *   get:
 *     summary: Get upcoming birthdays
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: List of upcoming birthdays
 */
router.get(
  '/birthdays',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead as string) : 7;
      const birthdays = await customerEngagementService.getUpcomingBirthdays(tenantId, daysAhead);
      res.json(birthdays);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get upcoming birthdays', 'GET_BIRTHDAYS');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/birthday-reminders/send:
 *   post:
 *     summary: Send birthday reminders with auto discount
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoCreateDiscount:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Birthday reminders sent
 */
router.post(
  '/birthday-reminders/send',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const autoCreateDiscount = req.body.autoCreateDiscount !== false;
      const result = await customerEngagementService.sendBirthdayReminders(tenantId, autoCreateDiscount);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send birthday reminders', 'SEND_BIRTHDAY_REMINDERS');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/feedback:
 *   post:
 *     summary: Submit customer feedback/review
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - rating
 *             properties:
 *               customerId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
router.post(
  '/feedback',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      customerId: z.string(),
      orderId: z.string().optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { customerId, orderId, rating, comment } = req.body;
      const feedback = await customerEngagementService.submitFeedback(tenantId, customerId, {
        orderId,
        rating,
        comment,
      });
      res.status(201).json(feedback);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to submit feedback', 'SUBMIT_FEEDBACK');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/feedback:
 *   get:
 *     summary: Get customer feedback/reviews
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of feedback/reviews
 */
router.get(
  '/feedback',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        customerId: req.query.customerId as string | undefined,
        orderId: req.query.orderId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await customerEngagementService.getFeedback(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get feedback', 'GET_FEEDBACK');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/rating:
 *   get:
 *     summary: Get average rating
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Average rating information
 */
router.get(
  '/rating',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const rating = await customerEngagementService.getAverageRating(tenantId);
      res.json(rating);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get average rating', 'GET_AVERAGE_RATING');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/promo-notifications/send:
 *   post:
 *     summary: Send promo notifications automatically
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promoId
 *             properties:
 *               promoId:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [ALL, MEMBERS, ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Promo notifications sent
 */
router.post(
  '/promo-notifications/send',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      promoId: z.string(),
      target: z.enum(['ALL', 'MEMBERS', 'ACTIVE', 'INACTIVE']).optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { promoId, target } = req.body;
      const result = await customerEngagementService.sendPromoNotifications(
        tenantId,
        promoId,
        target || 'ALL'
      );
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to send promo notifications', 'SEND_PROMO_NOTIFICATIONS');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/reviews:
 *   post:
 *     summary: Submit customer review (for products or services)
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - rating
 *             properties:
 *               customerId:
 *                 type: string
 *               productId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post(
  '/reviews',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      customerId: z.string(),
      productId: z.string().optional(),
      orderId: z.string().optional(),
      rating: z.number().int().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional(),
      isVerified: z.boolean().optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const review = await customerEngagementService.submitCustomerReview(tenantId, req.body.customerId, req.body);
      res.status(201).json(review);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to submit review', 'SUBMIT_REVIEW');
    }
  }
);

/**
 * @swagger
 * /api/customer-engagement/reviews:
 *   get:
 *     summary: Get customer reviews
 *     tags: [Customer Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get(
  '/reviews',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        customerId: req.query.customerId as string | undefined,
        productId: req.query.productId as string | undefined,
        orderId: req.query.orderId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await customerEngagementService.getCustomerReviews(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get reviews', 'GET_REVIEWS');
    }
  }
);

export default router;

