import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import subscriptionReceiptService from '../services/subscription-receipt.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import prisma from '../config/database';

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  templateType: z.enum(['DEFAULT', 'MODERN', 'MINIMAL', 'DETAILED', 'COMPACT']),
  paperSize: z.enum(['A4', 'THERMAL_58', 'THERMAL_80']),
  header: z.any().optional(),
  footer: z.any().optional(),
  fields: z.any().optional(),
  styles: z.any().optional(),
});

// All routes require Super Admin
const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
  const userRole = (req as any).user?.role;
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

router.get(
  '/templates',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const templates = await subscriptionReceiptService.getReceiptTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/templates/default',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const template = await subscriptionReceiptService.getDefaultTemplate();
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/templates/:id',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const template = await prisma.receiptTemplate.findFirst({
        where: {
          id: req.params.id,
          tenantId: 'platform',
        },
      });
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/templates',
  authGuard,
  requireSuperAdmin,
  validate({ body: createTemplateSchema }),
  async (req: Request, res: Response) => {
    try {
      const template = await subscriptionReceiptService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.put(
  '/templates/:id',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const template = await subscriptionReceiptService.updateTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.post(
  '/templates/:id/set-default',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const template = await subscriptionReceiptService.setDefaultTemplate(req.params.id);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.delete(
  '/templates/:id',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      await subscriptionReceiptService.deleteTemplate(req.params.id);
      res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  '/generate/:subscriptionId',
  authGuard,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const templateId = req.query.templateId as string | undefined;
      const receipt = await subscriptionReceiptService.generateReceipt(req.params.subscriptionId, templateId);
      res.json(receipt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;

