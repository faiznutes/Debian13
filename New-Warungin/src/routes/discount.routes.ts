import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import discountService from '../services/discount.service';
import { validate } from '../middlewares/validator';
import { z } from 'zod';
import { requireTenantId } from '../utils/tenant';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

const router = Router();

const createDiscountSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['AMOUNT_BASED', 'BUNDLE', 'PRODUCT_BASED']),
  discountValue: z.number().positive(),
  discountValueType: z.enum(['PERCENTAGE', 'FIXED']),
  minAmount: z.number().optional(),
  minQuantity: z.number().int().positive().optional(),
  applicableProducts: z.array(z.string()).optional(),
  bundleProducts: z.array(z.string()).optional(),
  bundleDiscountProduct: z.string().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateDiscountSchema = createDiscountSchema.partial();

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts for tenant
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const discounts = await discountService.getDiscounts(tenantId);
      res.json({ data: discounts });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/discounts/:id:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const discount = await prisma.discount.findFirst({
        where: {
          id: req.params.id,
          tenantId,
        },
      });

      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }

      res.json(discount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a new discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createDiscountSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;

      // Only ADMIN_TENANT and SUPER_ADMIN can create discounts
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admin can create discounts' });
      }

      const discountData = {
        ...req.body,
        tenantId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        applicableProducts: req.body.applicableProducts || null,
        bundleProducts: req.body.bundleProducts || null,
      };

      const discount = await prisma.discount.create({
        data: discountData,
      });

      // Invalidate analytics cache after discount creation
      await invalidateAnalyticsCache(tenantId);

      res.status(201).json(discount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/discounts/:id:
 *   put:
 *     summary: Update a discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updateDiscountSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;

      // Only ADMIN_TENANT and SUPER_ADMIN can update discounts
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admin can update discounts' });
      }

      const existingDiscount = await prisma.discount.findFirst({
        where: {
          id: req.params.id,
          tenantId,
        },
      });

      if (!existingDiscount) {
        return res.status(404).json({ message: 'Discount not found' });
      }

      const updateData: any = { ...req.body };
      if (req.body.startDate !== undefined) {
        updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      }
      if (req.body.endDate !== undefined) {
        updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
      }

      const discount = await prisma.discount.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Invalidate analytics cache after discount update
      await invalidateAnalyticsCache(tenantId);

      res.json(discount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/discounts/:id:
 *   delete:
 *     summary: Delete a discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;

      // Only ADMIN_TENANT and SUPER_ADMIN can delete discounts
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admin can delete discounts' });
      }

      const existingDiscount = await prisma.discount.findFirst({
        where: {
          id: req.params.id,
          tenantId,
        },
      });

      if (!existingDiscount) {
        return res.status(404).json({ message: 'Discount not found' });
      }

      await prisma.discount.delete({
        where: { id: req.params.id },
      });

      // Invalidate analytics cache after discount deletion
      await invalidateAnalyticsCache(tenantId);

      res.json({ message: 'Discount deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Helper function to invalidate analytics cache
 */
async function invalidateAnalyticsCache(tenantId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    if (redis) {
      // Delete all analytics cache keys for this tenant
      const keys = await redis.keys(`analytics:*:${tenantId}`);
      const keys2 = await redis.keys(`analytics:${tenantId}:*`);
      const allKeys = [...keys, ...keys2];
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        logger.info('Invalidated analytics cache after discount operation', {
          tenantId,
          cacheKeysDeleted: allKeys.length
        });
      }
    }
  } catch (error: any) {
    logger.warn('Failed to invalidate analytics cache', {
      error: error.message,
      tenantId
    });
  }
}

export default router;

