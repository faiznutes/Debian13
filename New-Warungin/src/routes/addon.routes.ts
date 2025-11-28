import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import addonService from '../services/addon.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import prisma from '../config/database';

const router = Router();

const subscribeAddonSchema = z.object({
  addonId: z.string().min(1),
  addonName: z.string().min(1),
  addonType: z.string().min(1),
  limit: z.number().nullable().optional(),
  duration: z.number().int().positive().optional(),
}).passthrough(); // Allow additional fields

router.get(
  '/available',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      // Available addons are the same for all tenants
      // Super Admin can view available addons for any tenant
      const addons = await addonService.getAvailableAddons();
      res.json(addons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const addons = await addonService.getTenantAddons(tenantId);
      res.json(addons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/subscribe',
  authGuard,
  validate({ body: subscribeAddonSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can subscribe to addons
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can subscribe to addons' });
      }

      // For SUPER_ADMIN, addon is activated immediately without payment
      // For ADMIN_TENANT, this endpoint is called after payment webhook (or direct for testing)
      
      // Prepare data for service
      const addonData = {
        addonId: req.body.addonId,
        addonName: req.body.addonName,
        addonType: req.body.addonType,
        limit: req.body.limit || null,
        duration: req.body.duration || undefined,
      };

      const addon = await addonService.subscribeAddon(tenantId, addonData);
      
      // Log for Super Admin direct activation
      if (userRole === 'SUPER_ADMIN') {
        console.log(`✅ Super Admin activated addon for tenant ${tenantId}:`, {
          addonId: addon.id,
          addonName: addonData.addonName,
          addonType: addonData.addonType,
        });
      }
      
      res.status(201).json(addon);
    } catch (error: any) {
      console.error('Error subscribing addon:', error);
      res.status(400).json({ message: error.message || 'Gagal menambahkan addon' });
    }
  }
);

router.post(
  '/unsubscribe/:addonId',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can unsubscribe from addons' });
      }

      await addonService.unsubscribeAddon(tenantId, req.params.addonId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  '/check-limit/:type',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await addonService.checkLimit(tenantId, req.params.type);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

const extendAddonSchema = z.object({
  addonId: z.string(),
  duration: z.number().int().positive(),
});

router.post(
  '/extend',
  authGuard,
  validate({ body: extendAddonSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can extend addons
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin or super admin can extend addons' });
      }

      const result = await addonService.extendAddon(tenantId, req.body.addonId, req.body.duration);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

const reduceAddonSchema = z.object({
  addonId: z.string(),
  duration: z.number().int().positive(),
});

router.post(
  '/reduce',
  authGuard,
  validate({ body: reduceAddonSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can reduce addons
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can reduce addons' });
      }

      const result = await addonService.reduceAddon(tenantId, req.body.addonId, req.body.duration);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * Delete addon (Super Admin only)
 */
router.delete(
  '/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userRole = authReq.role || authReq.user?.role;
      
      // Only SUPER_ADMIN can delete addon
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can delete addon' });
      }

      const addonId = req.params.id;
      
      // Check if addon exists
      const addon = await prisma.tenantAddon.findUnique({
        where: { id: addonId },
      });

      if (!addon) {
        return res.status(404).json({ message: 'Addon not found' });
      }

      // Delete addon
      await prisma.tenantAddon.delete({
        where: { id: addonId },
      });

      res.json({ message: 'Addon deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting addon:', error);
      res.status(500).json({ message: error.message || 'Failed to delete addon' });
    }
  }
);

/**
 * Bulk delete addons (Super Admin only)
 */
router.post(
  '/bulk-delete',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userRole = authReq.role || authReq.user?.role;
      
      // Only SUPER_ADMIN can bulk delete addons
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can bulk delete addons' });
      }

      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs array is required' });
      }

      // Delete addons
      const result = await prisma.tenantAddon.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      res.json({ 
        message: `${result.count} addon(s) deleted successfully`,
        deletedCount: result.count,
      });
    } catch (error: any) {
      console.error('Error bulk deleting addons:', error);
      res.status(500).json({ message: error.message || 'Failed to bulk delete addons' });
    }
  }
);

export default router;

