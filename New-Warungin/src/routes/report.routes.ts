import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import reportService from '../services/report.service';
import { requireTenantId } from '../utils/tenant';
import { checkExportReportsAddon } from '../middlewares/addon-guard';

const router = Router();

/**
 * @swagger
 * /api/reports/global:
 *   get:
 *     summary: Get global reports (Super Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  '/global',
  authGuard,
  async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      
      // Only Super Admin can access global reports
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
      }

      const { startDate, endDate } = req.query;
      let start = startDate ? new Date(startDate as string) : undefined;
      let end = endDate ? new Date(endDate as string) : undefined;
      
      // If end date is provided, set time to end of day to include all subscriptions created on that day
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      
      // If start date is provided, set time to start of day
      if (start) {
        start.setHours(0, 0, 0, 0);
      }

      const report = await reportService.getGlobalReport(start, end);
      res.json(report);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/reports/tenant:
 *   get:
 *     summary: Get tenant-specific reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [sales, products, customers]
 */
router.get(
  '/tenant',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { startDate, endDate, reportType, period, format } = req.query;

      // Check if export format is requested (requires EXPORT_REPORTS addon)
      if (format && (format === 'CSV' || format === 'PDF' || format === 'EXCEL')) {
        // Check addon for export
        const addons = await (await import('../services/addon.service')).default.getTenantAddons(tenantId);
        const hasExportAddon = addons.some(
          (addon) => addon.addonType === 'EXPORT_REPORTS' && addon.status === 'active'
        );
        
        if (!hasExportAddon) {
          return res.status(403).json({ 
            message: 'Export Laporan addon is required to export reports' 
          });
        }
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const type = (reportType as string) || 'sales';
      const periodType = (period as string) || 'all';

      // Use new report service methods
      let report: any;
      switch (type) {
        case 'sales':
          report = await reportService.generateSalesReport(tenantId, {
            startDate: start?.toISOString(),
            endDate: end?.toISOString(),
            period: periodType as any,
            format: format as any,
          });
          break;
        case 'products':
          report = await reportService.generateProductReport(tenantId, {
            startDate: start?.toISOString(),
            endDate: end?.toISOString(),
            period: periodType as any,
            format: format as any,
          });
          break;
        case 'customers':
          report = await reportService.generateCustomerReport(tenantId, {
            startDate: start?.toISOString(),
            endDate: end?.toISOString(),
            period: periodType as any,
            format: format as any,
          });
          break;
        case 'inventory':
          report = await reportService.generateInventoryReport(tenantId, {
            format: format as any,
          });
          break;
        case 'financial':
          report = await reportService.generateFinancialReport(tenantId, {
            startDate: start?.toISOString(),
            endDate: end?.toISOString(),
            period: periodType as any,
            format: format as any,
          });
          break;
        default:
          // Fallback to old method
          report = await reportService.getTenantReport(tenantId, start, end, type);
      }

      res.json(report);
    } catch (error: any) {
      console.error('Error loading tenant report:', error);
      res.status(500).json({ message: error.message || 'Failed to load tenant report' });
    }
  }
);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get tenant reports (alias for /tenant)
 *     tags: [Reports]
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
      const { startDate, endDate, type } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const reportType = (type as string) || 'sales';

      const report = await reportService.getTenantReport(tenantId, start, end, reportType);
      res.json(report);
    } catch (error: any) {
      console.error('Error loading report:', error);
      res.status(500).json({ message: error.message || 'Failed to load report' });
    }
  }
);

/**
 * @swagger
 * /api/reports/global/export/pdf:
 *   get:
 *     summary: Export global report as PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/global/export/pdf',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Only Super Admin can access global reports
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const report = await reportService.getGlobalReport(start, end);
      
      // Generate HTML for PDF
      const html = reportService.generateGlobalReportPDF(report, start, end);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="laporan-global-${startDate || 'all'}-${endDate || 'all'}.html"`);
      res.send(html);
    } catch (error: any) {
      console.error('Error exporting global report PDF:', error);
      res.status(500).json({ message: error.message || 'Failed to export PDF' });
    }
  }
);

export default router;

