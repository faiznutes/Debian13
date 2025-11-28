/**
 * E-commerce Integration Routes
 * API endpoints for e-commerce platform integrations
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import ecommerceIntegrationService from '../services/ecommerce-integration.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @swagger
 * /api/ecommerce/sync-product:
 *   post:
 *     summary: Sync product to e-commerce platform
 *     tags: [E-commerce Integration]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sync-product',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      platform: z.enum(['SHOPEE', 'TOKOPEDIA', 'BUKALAPAK']),
      productId: z.string(),
      syncPrice: z.boolean(),
      syncStock: z.boolean(),
      syncImages: z.boolean(),
      config: z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
        shopId: z.string().optional(),
        accessToken: z.string().optional(),
      }),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { platform, productId, syncPrice, syncStock, syncImages, config } = req.body;

      let result;
      switch (platform) {
        case 'SHOPEE':
          result = await ecommerceIntegrationService.syncProductToShopee(tenantId, { platform, ...config }, {
            productId,
            syncPrice,
            syncStock,
            syncImages,
          });
          break;
        case 'TOKOPEDIA':
          result = await ecommerceIntegrationService.syncProductToTokopedia(tenantId, { platform, ...config }, {
            productId,
            syncPrice,
            syncStock,
            syncImages,
          });
          break;
        case 'BUKALAPAK':
          result = await ecommerceIntegrationService.syncProductToBukalapak(tenantId, { platform, ...config }, {
            productId,
            syncPrice,
            syncStock,
            syncImages,
          });
          break;
        default:
          return res.status(400).json({ error: 'Unsupported platform' });
      }

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to sync product', 'SYNC_PRODUCT_ECOMMERCE');
    }
  }
);

/**
 * @swagger
 * /api/ecommerce/sync-order:
 *   post:
 *     summary: Sync order from e-commerce platform
 *     tags: [E-commerce Integration]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sync-order',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      platform: z.enum(['SHOPEE', 'TOKOPEDIA', 'BUKALAPAK']),
      ecommerceOrderId: z.string(),
      config: z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
        accessToken: z.string().optional(),
      }),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { platform, ecommerceOrderId, config } = req.body;

      const result = await ecommerceIntegrationService.syncOrderFromEcommerce(tenantId, { platform, ...config }, {
        ecommerceOrderId,
        platform,
      });

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to sync order', 'SYNC_ORDER_ECOMMERCE');
    }
  }
);

export default router;

