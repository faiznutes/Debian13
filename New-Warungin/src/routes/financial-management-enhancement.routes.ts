/**
 * Financial Management Enhancement Routes
 * API endpoints for cash flow, expenses, tax, forecasting, bank reconciliation
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { requireTenantId } from '../utils/tenant';
import financialManagementService from '../services/financial-management-enhancement.service';
import { handleRouteError } from '../utils/route-error-handler';
import { z } from 'zod';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @swagger
 * /api/financial-management/cash-flow:
 *   post:
 *     summary: Record cash flow entry
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/cash-flow',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      type: z.enum(['INCOME', 'EXPENSE']),
      category: z.string(),
      amount: z.number().positive(),
      description: z.string(),
      date: z.string().datetime(),
      paymentMethod: z.string(),
      reference: z.string().optional(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const entry = await financialManagementService.recordCashFlow(tenantId, {
        ...req.body,
        date: new Date(req.body.date),
      });
      res.status(201).json(entry);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to record cash flow', 'RECORD_CASH_FLOW');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/cash-flow/summary:
 *   get:
 *     summary: Get cash flow summary
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/cash-flow/summary',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const dateRange = req.query.startDate && req.query.endDate ? {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
      } : undefined;
      const summary = await financialManagementService.getCashFlowSummary(tenantId, dateRange);
      res.json(summary);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get cash flow summary', 'GET_CASH_FLOW_SUMMARY');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/expenses:
 *   post:
 *     summary: Record expense
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/expenses',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      category: z.string(),
      amount: z.number().positive(),
      description: z.string(),
      date: z.string().datetime(),
      vendor: z.string().optional(),
      receipt: z.string().optional(),
      isTaxDeductible: z.boolean(),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const expense = await financialManagementService.recordExpense(tenantId, {
        ...req.body,
        date: new Date(req.body.date),
      });
      res.status(201).json(expense);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to record expense', 'RECORD_EXPENSE');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/expenses/by-category:
 *   get:
 *     summary: Get expenses by category
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/expenses/by-category',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const dateRange = req.query.startDate && req.query.endDate ? {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
      } : undefined;
      const expenses = await financialManagementService.getExpensesByCategory(tenantId, dateRange);
      res.json(expenses);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get expenses by category', 'GET_EXPENSES_BY_CATEGORY');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/tax/calculate:
 *   post:
 *     summary: Calculate tax
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/tax/calculate',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const taxCalculation = await financialManagementService.calculateTax(tenantId, req.body.period);
      res.json(taxCalculation);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to calculate tax', 'CALCULATE_TAX');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/forecast:
 *   get:
 *     summary: Get financial forecast
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/forecast',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      const forecast = await financialManagementService.getFinancialForecast(tenantId, months);
      res.json(forecast);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get financial forecast', 'GET_FINANCIAL_FORECAST');
    }
  }
);

/**
 * @swagger
 * /api/financial-management/bank-reconciliation:
 *   post:
 *     summary: Reconcile bank statement
 *     tags: [Financial Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bank-reconciliation',
  authGuard,
  subscriptionGuard,
  validate({
    body: z.object({
      bankAccount: z.string(),
      statementDate: z.string().datetime(),
      statementBalance: z.number(),
      transactions: z.array(z.object({
        date: z.string().datetime(),
        description: z.string(),
        amount: z.number(),
        type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
      })),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const reconciliation = await financialManagementService.reconcileBankStatement(tenantId, {
        ...req.body,
        statementDate: new Date(req.body.statementDate),
        transactions: req.body.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        })),
      });
      res.status(201).json(reconciliation);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to reconcile bank statement', 'RECONCILE_BANK');
    }
  }
);

export default router;

