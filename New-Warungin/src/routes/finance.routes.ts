import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { requireTenantId } from '../utils/tenant';
import financeService from '../services/finance.service';
import { checkBusinessAnalyticsAddon } from '../middlewares/addon-guard';

const router = Router();

/**
 * @swagger
 * /api/finance/summary:
 *   get:
 *     summary: Get financial summary
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 totalExpenses:
 *                   type: number
 *                 netProfit:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/summary',
  authGuard,
  async (req: Request, res: Response, next) => {
    try {
      const tenantId = requireTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const summary = await financeService.getFinancialSummary(tenantId, startDate, endDate);
      res.json(summary);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/finance/profit-loss:
 *   get:
 *     summary: Get profit and loss statement
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for profit-loss statement
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for profit-loss statement
 *       - in: query
 *         name: export
 *         schema:
 *           type: boolean
 *         description: Export as PDF if true
 *     responses:
 *       200:
 *         description: Profit and loss statement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: number
 *                 expenses:
 *                   type: number
 *                 profit:
 *                   type: number
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Business Analytics addon required
 */
router.get(
  '/profit-loss',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response, next) => {
    try {
      const userRole = (req as any).user?.role;
      
      // For Super Admin, return platform revenue profit-loss (subscriptions & addons)
      if (userRole === 'SUPER_ADMIN') {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const shouldExport = req.query.export === 'true';
        const profitLoss = await financeService.getPlatformProfitLoss(startDate, endDate);
        
        // If export requested, generate PDF
        if (shouldExport) {
          const { generatePDF } = await import('../services/pdf.service');
          const pdfBuffer = await generatePDF('profit-loss', {
            profitLoss,
            startDate,
            endDate,
            tenantId: 'platform',
            tenantName: 'Platform Revenue',
          });
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=laporan-laba-rugi-platform-${startDate || 'all'}-${endDate || 'all'}.pdf`);
          res.send(pdfBuffer);
          return;
        }
        
        return res.json(profitLoss);
      }
      
      const tenantId = requireTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const shouldExport = req.query.export === 'true';
      
      const profitLoss = await financeService.getProfitLoss(tenantId, startDate, endDate);
      
      // If export requested, generate PDF
      if (shouldExport) {
        const { generatePDF } = await import('../services/pdf.service');
        const prisma = (await import('../config/database')).default;
        
        // Get tenant name for PDF
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true },
        });
        
        const pdfBuffer = await generatePDF('profit-loss', {
          profitLoss,
          startDate,
          endDate,
          tenantId,
          tenantName: tenant?.name || 'Tenant',
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-laba-rugi-${startDate || 'all'}-${endDate || 'all'}.pdf`);
        res.send(pdfBuffer);
        return;
      }
      
      res.json(profitLoss);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/finance/balance-sheet:
 *   get:
 *     summary: Get balance sheet
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for balance sheet
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for balance sheet
 *     responses:
 *       200:
 *         description: Balance sheet data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assets:
 *                   type: number
 *                 liabilities:
 *                   type: number
 *                 equity:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/balance-sheet',
  authGuard,
  async (req: Request, res: Response, next) => {
    try {
      const tenantId = requireTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const balanceSheet = await financeService.getBalanceSheet(tenantId, startDate, endDate);
      res.json(balanceSheet);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/finance/cash-flow:
 *   get:
 *     summary: Get cash flow statement
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for cash flow statement
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for cash flow statement
 *     responses:
 *       200:
 *         description: Cash flow statement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 operating:
 *                   type: number
 *                 investing:
 *                   type: number
 *                 financing:
 *                   type: number
 *                 netCashFlow:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/cash-flow',
  authGuard,
  async (req: Request, res: Response, next) => {
    try {
      const tenantId = requireTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const cashFlow = await financeService.getCashFlow(tenantId, startDate, endDate);
      res.json(cashFlow);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

