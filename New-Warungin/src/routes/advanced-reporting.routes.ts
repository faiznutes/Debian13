/**
 * Advanced Reporting Routes
 * API endpoints for custom reports, scheduled reports, export templates
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId, requireUserId } from '../utils/tenant';
import advancedReportingService from '../services/advanced-reporting.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @swagger
 * /api/advanced-reporting/templates:
 *   get:
 *     summary: Get all report templates
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/templates',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        type: req.query.type as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await advancedReportingService.getReportTemplates(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get report templates', 'GET_REPORT_TEMPLATES');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/templates:
 *   post:
 *     summary: Create custom report template
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/templates',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.string(),
      config: z.unknown(), // Use z.unknown() instead of deprecated z.any()
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await advancedReportingService.createReportTemplate(tenantId, req.body);
      res.status(201).json(template);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create report template', 'CREATE_REPORT_TEMPLATE');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/generate:
 *   post:
 *     summary: Generate custom report
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/generate',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      templateId: z.string(),
      dateRange: z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }).optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { templateId, dateRange } = req.body;
      const report = await advancedReportingService.generateCustomReport(
        tenantId,
        templateId,
        dateRange ? {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        } : undefined
      );
      res.json(report);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to generate report', 'GENERATE_REPORT');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/scheduled:
 *   get:
 *     summary: Get scheduled reports
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/scheduled',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await advancedReportingService.getScheduledReports(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get scheduled reports', 'GET_SCHEDULED_REPORTS');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/scheduled:
 *   post:
 *     summary: Create scheduled report
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/scheduled',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      templateId: z.string(),
      schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
      scheduleConfig: z.unknown().optional(), // Use z.unknown() instead of deprecated z.any()
      recipients: z.array(z.string().email()),
      format: z.enum(['PDF', 'EXCEL', 'CSV', 'HTML']),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const scheduledReport = await advancedReportingService.createScheduledReport(tenantId, req.body);
      res.status(201).json(scheduledReport);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create scheduled report', 'CREATE_SCHEDULED_REPORT');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/dashboard-settings:
 *   get:
 *     summary: Get dashboard customization settings
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/dashboard-settings',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      const settings = await advancedReportingService.getDashboardSettings(tenantId, userId);
      res.json(settings);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get dashboard settings', 'GET_DASHBOARD_SETTINGS');
    }
  }
);

/**
 * @swagger
 * /api/advanced-reporting/dashboard-settings:
 *   put:
 *     summary: Save dashboard customization settings
 *     tags: [Advanced Reporting]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/dashboard-settings',
  authGuard,
  subscriptionGuard,
  validate({ body: z.object({}).passthrough() }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = requireUserId(req);
      await advancedReportingService.saveDashboardSettings(tenantId, userId, req.body);
      res.json({ success: true });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to save dashboard settings', 'SAVE_DASHBOARD_SETTINGS');
    }
  }
);

export default router;

