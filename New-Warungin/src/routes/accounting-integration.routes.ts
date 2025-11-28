/**
 * Accounting Integration Routes
 * API endpoints for accounting software integrations
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import accountingIntegrationService from '../services/accounting-integration.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @swagger
 * /api/accounting/sync-transaction:
 *   post:
 *     summary: Sync transaction to accounting software
 *     tags: [Accounting Integration]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sync-transaction',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      provider: z.enum(['JURNAL', 'ACCURATE', 'MYOB']),
      transactionId: z.string(),
      syncType: z.enum(['SALE', 'EXPENSE', 'PAYMENT']),
      config: z.object({
        apiKey: z.string(),
        apiSecret: z.string().optional(),
        companyId: z.string().optional(),
        accessToken: z.string().optional(),
      }),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { provider, transactionId, syncType, config } = req.body;

      let result;
      switch (provider) {
        case 'JURNAL':
          result = await accountingIntegrationService.syncToJurnal(tenantId, { provider, ...config }, {
            transactionId,
            syncType,
          });
          break;
        case 'ACCURATE':
          result = await accountingIntegrationService.syncToAccurate(tenantId, { provider, ...config }, {
            transactionId,
            syncType,
          });
          break;
        case 'MYOB':
          result = await accountingIntegrationService.syncToMYOB(tenantId, { provider, ...config }, {
            transactionId,
            syncType,
          });
          break;
        default:
          return res.status(400).json({ error: 'Unsupported provider' });
      }

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to sync transaction', 'SYNC_TRANSACTION_ACCOUNTING');
    }
  }
);

/**
 * @swagger
 * /api/accounting/sync-financial-summary:
 *   post:
 *     summary: Sync financial summary to accounting software
 *     tags: [Accounting Integration]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sync-financial-summary',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      provider: z.enum(['JURNAL', 'ACCURATE', 'MYOB']),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      config: z.object({
        apiKey: z.string(),
        apiSecret: z.string().optional(),
        companyId: z.string().optional(),
        accessToken: z.string().optional(),
      }),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { provider, startDate, endDate, config } = req.body;

      const dateRange = startDate && endDate ? {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      } : undefined;

      const result = await accountingIntegrationService.syncFinancialSummary(
        tenantId,
        { provider, ...config },
        dateRange
      );

      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to sync financial summary', 'SYNC_FINANCIAL_SUMMARY');
    }
  }
);

/**
 * @swagger
 * /api/accounting/chart-of-accounts:
 *   get:
 *     summary: Get chart of accounts from accounting software
 *     tags: [Accounting Integration]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/chart-of-accounts',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const provider = req.query.provider as 'JURNAL' | 'ACCURATE' | 'MYOB';
      const config = {
        provider,
        apiKey: req.query.apiKey as string,
        apiSecret: req.query.apiSecret as string,
        companyId: req.query.companyId as string,
        accessToken: req.query.accessToken as string,
      };

      const accounts = await accountingIntegrationService.getChartOfAccounts(tenantId, config);
      res.json(accounts);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get chart of accounts', 'GET_CHART_OF_ACCOUNTS');
    }
  }
);

export default router;

