import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import receiptService from '../services/receipt.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import prisma from '../config/database';
import { checkReceiptEditorAddon } from '../middlewares/addon-guard';

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

router.get(
  '/templates',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const templates = await receiptService.getReceiptTemplates(tenantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/templates/default',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await receiptService.getDefaultTemplate(tenantId);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/templates/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await prisma.receiptTemplate.findFirst({
        where: {
          id: req.params.id,
          tenantId,
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
  checkReceiptEditorAddon,
  validate({ body: createTemplateSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await receiptService.createTemplate(tenantId, req.body);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.put(
  '/templates/:id',
  authGuard,
  checkReceiptEditorAddon,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await receiptService.updateTemplate(req.params.id, tenantId, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.post(
  '/templates/:id/set-default',
  authGuard,
  checkReceiptEditorAddon,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const template = await receiptService.setDefaultTemplate(req.params.id, tenantId);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.delete(
  '/templates/:id',
  authGuard,
  checkReceiptEditorAddon,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      await receiptService.deleteTemplate(req.params.id, tenantId);
      res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  '/generate/:orderId',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const templateId = req.query.templateId as string | undefined;
      const receipt = await receiptService.generateReceipt(req.params.orderId, tenantId, templateId);
      res.json(receipt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;

