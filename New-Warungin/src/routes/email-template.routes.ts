/**
 * Email Template Routes
 * API endpoints for managing email templates
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import emailTemplateService from '../services/email-template.service';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['PROMOTION', 'NOTIFICATION', 'TRANSACTIONAL']).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * @swagger
 * /api/email-templates:
 *   get:
 *     summary: Get all email templates
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [PROMOTION, NOTIFICATION, TRANSACTIONAL]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of email templates
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
      const category = req.query.category as string | undefined;
      const templates = await emailTemplateService.getTemplates(tenantId, category);
      res.json(templates);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_TEMPLATE');
    }
  }
);

/**
 * @swagger
 * /api/email-templates/{id}:
 *   get:
 *     summary: Get email template by ID
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Email template details
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
      const template = await emailTemplateService.getTemplateById(req.params.id, tenantId);
      res.json(template);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_TEMPLATE');
    }
  }
);

/**
 * @swagger
 * /api/email-templates:
 *   post:
 *     summary: Create new email template
 *     tags: [Email Templates]
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
 *               - subject
 *               - htmlContent
 *             properties:
 *               name:
 *                 type: string
 *                 example: Welcome Email
 *               subject:
 *                 type: string
 *                 example: Welcome to {{businessName}}!
 *               htmlContent:
 *                 type: string
 *                 example: "<h1>Welcome {{name}}!</h1>"
 *               textContent:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["name", "email", "businessName"]
 *               category:
 *                 type: string
 *                 enum: [PROMOTION, NOTIFICATION, TRANSACTIONAL]
 *     responses:
 *       201:
 *         description: Email template created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createTemplateSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await emailTemplateService.createTemplate(tenantId, req.body);
      res.status(201).json(template);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create template', 'CREATE_TEMPLATE');
    }
  }
);

/**
 * @swagger
 * /api/email-templates/{id}:
 *   put:
 *     summary: Update email template
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               textContent:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: [PROMOTION, NOTIFICATION, TRANSACTIONAL]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email template updated successfully
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
  validate({ body: updateTemplateSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await emailTemplateService.updateTemplate(req.params.id, tenantId, req.body);
      res.json(template);
    } catch (error: any) {
      if (error.message === 'Email template not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/email-templates/{id}:
 *   delete:
 *     summary: Delete email template
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Email template deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await emailTemplateService.deleteTemplate(req.params.id, tenantId);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_TEMPLATE');
    }
  }
);

/**
 * @swagger
 * /api/email-templates/{id}/render:
 *   post:
 *     summary: Render email template with variables
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variables:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example: { "name": "John", "email": "john@example.com" }
 *     responses:
 *       200:
 *         description: Rendered template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subject:
 *                   type: string
 *                 html:
 *                   type: string
 *                 text:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/:id/render',
  authGuard,
  subscriptionGuard,
  validate({ body: z.object({ variables: z.record(z.string()) }) }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await emailTemplateService.getTemplateById(req.params.id, tenantId);
      const rendered = emailTemplateService.renderTemplate(template, req.body.variables || {});
      res.json(rendered);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'EMAIL_TEMPLATE');
    }
  }
);

export default router;

