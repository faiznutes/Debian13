/**
 * Advanced Reporting Service
 * Handles custom report builder, scheduled reports, export templates, dashboard customization
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import { sendEmail } from '../config/email';
import reportService from './report.service';

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'SALES' | 'INVENTORY' | 'FINANCIAL' | 'CUSTOMER' | 'CUSTOM';
  config: {
    columns: Array<{ field: string; label: string; type: string }>;
    filters: Array<{ field: string; operator: string; value: any }>;
    grouping?: Array<{ field: string }>;
    sorting?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  scheduleConfig?: {
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time?: string; // HH:mm format
    cronExpression?: string; // For custom schedule
  };
  recipients: string[]; // Email addresses
  format: 'PDF' | 'EXCEL' | 'CSV' | 'HTML';
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

class AdvancedReportingService {
  /**
   * Create custom report template
   */
  async createReportTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      type: string;
      config: any;
    }
  ): Promise<ReportTemplate> {
    try {
      // In production, save to database
      // For now, return mock structure
      const template: ReportTemplate = {
        id: `template-${Date.now()}`,
        name: data.name,
        description: data.description,
        type: data.type as any,
        config: data.config,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info('Report template created:', template);

      const savedTemplate = await prisma.reportTemplate.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description,
          type: data.type,
          config: data.config,
        },
      });

      return {
        ...template,
        id: savedTemplate.id,
        createdAt: savedTemplate.createdAt,
        updatedAt: savedTemplate.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error creating report template:', error);
      throw error;
    }
  }

  /**
   * Get all report templates
   */
  async getReportTemplates(tenantId: string, query: { type?: string; page?: number; limit?: number }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId, isActive: true };
      if (query.type) where.type = query.type;

      const [templates, total] = await Promise.all([
        prisma.reportTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.reportTemplate.count({ where }),
      ]);

      return {
        data: templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting report templates:', error);
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(
    tenantId: string,
    templateId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any> {
    try {
      // Get template
      const template = await prisma.reportTemplate.findFirst({
        where: { id: templateId, tenantId, isActive: true },
      });

      if (!template) {
        throw new Error('Report template not found');
      }

      // Generate report data based on template config
      // This would query the database based on template.config
      const config = template.config as any;
      let data: any[] = [];
      let summary: any = {};

      // Based on report type, query different data sources
      if (template.type === 'SALES') {
        const where: any = { tenantId };
        if (dateRange) {
          where.createdAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          };
        }
        const orders = await prisma.order.findMany({ where });
        data = orders;
        summary = {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        };
      } else if (template.type === 'INVENTORY') {
        const products = await prisma.product.findMany({ where: { tenantId } });
        data = products;
        summary = {
          totalProducts: products.length,
          totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        };
      } else if (template.type === 'FINANCIAL') {
        const where: any = { tenantId };
        if (dateRange) {
          where.createdAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          };
        }
        const transactions = await prisma.transaction.findMany({ where });
        data = transactions;
        summary = {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
        };
      }

      const reportData = {
        templateId,
        templateName: template.name,
        generatedAt: new Date(),
        dateRange,
        data,
        summary,
      };

      logger.info('Custom report generated:', reportData);

      return reportData;
    } catch (error: any) {
      logger.error('Error generating custom report:', error);
      throw error;
    }
  }

  /**
   * Create scheduled report
   */
  async createScheduledReport(
    tenantId: string,
    data: {
      templateId: string;
      schedule: string;
      scheduleConfig?: any;
      recipients: string[];
      format: string;
    }
  ): Promise<ScheduledReport> {
    try {
      const scheduledReport: ScheduledReport = {
        id: `scheduled-${Date.now()}`,
        templateId: data.templateId,
        schedule: data.schedule as any,
        scheduleConfig: data.scheduleConfig,
        recipients: data.recipients,
        format: data.format as any,
        isActive: true,
        nextRunAt: this.calculateNextRun(data.schedule, data.scheduleConfig),
      };

      logger.info('Scheduled report created:', scheduledReport);

      const saved = await prisma.scheduledReport.create({
        data: {
          tenantId,
          templateId: data.templateId,
          name: `Scheduled Report - ${new Date().toISOString()}`,
          schedule: data.schedule,
          scheduleConfig: data.scheduleConfig || {},
          format: data.format,
          recipients: data.recipients,
          isActive: true,
          nextRunAt: this.calculateNextRun(data.schedule, data.scheduleConfig),
        },
      });

      return {
        id: saved.id,
        templateId: saved.templateId,
        schedule: saved.schedule as any,
        scheduleConfig: saved.scheduleConfig as any,
        recipients: saved.recipients,
        format: saved.format as any,
        isActive: saved.isActive,
        nextRunAt: saved.nextRunAt,
        lastRunAt: saved.lastRunAt || undefined,
      };
    } catch (error: any) {
      logger.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  /**
   * Calculate next run time for scheduled report
   */
  private calculateNextRun(schedule: string, scheduleConfig?: any): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule) {
      case 'DAILY':
        nextRun.setDate(now.getDate() + 1);
        if (scheduleConfig?.time) {
          const [hours, minutes] = scheduleConfig.time.split(':');
          nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          nextRun.setHours(9, 0, 0, 0); // Default 9 AM
        }
        break;

      case 'WEEKLY':
        const dayOfWeek = scheduleConfig?.dayOfWeek ?? 1; // Monday
        const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilNext);
        if (scheduleConfig?.time) {
          const [hours, minutes] = scheduleConfig.time.split(':');
          nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          nextRun.setHours(9, 0, 0, 0);
        }
        break;

      case 'MONTHLY':
        const dayOfMonth = scheduleConfig?.dayOfMonth ?? 1;
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(dayOfMonth);
        if (scheduleConfig?.time) {
          const [hours, minutes] = scheduleConfig.time.split(':');
          nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          nextRun.setHours(9, 0, 0, 0);
        }
        break;

      case 'CUSTOM':
        // For custom cron expressions, would need a cron parser
        // For now, default to next day
        nextRun.setDate(now.getDate() + 1);
        break;
    }

    return nextRun;
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(tenantId: string, query: { status?: string; page?: number; limit?: number }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.status) {
        // Map status to isActive
        where.isActive = query.status === 'ACTIVE';
      }

      const [reports, total] = await Promise.all([
        prisma.scheduledReport.findMany({
          where,
          skip,
          take: limit,
          include: {
            template: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.scheduledReport.count({ where }),
      ]);

      return {
        data: reports.map(r => ({
          id: r.id,
          templateId: r.templateId,
          templateName: r.template.name,
          schedule: r.schedule,
          scheduleConfig: r.scheduleConfig,
          format: r.format,
          recipients: r.recipients,
          status: r.isActive ? 'ACTIVE' : 'INACTIVE',
          nextRunAt: r.nextRunAt,
          lastRunAt: r.lastRunAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Execute scheduled reports
   */
  async executeScheduledReports(tenantId?: string): Promise<{ executed: number; failed: number }> {
    try {
      // Get all active scheduled reports
      const where: any = { isActive: true };
      if (tenantId) where.tenantId = tenantId;
      where.nextRunAt = { lte: new Date() };

      const scheduledReports = await prisma.scheduledReport.findMany({
        where,
        include: { template: true },
      });
      let executed = 0;
      let failed = 0;

      for (const scheduledReport of scheduledReports) {
        try {
          // Generate report
          const reportData = await this.generateCustomReport(
            tenantId || '',
            scheduledReport.templateId
          );

          // Export report in requested format
          const exportedReport = await this.exportReport(reportData, scheduledReport.format);

          // Send via email
          for (const recipient of scheduledReport.recipients) {
            try {
              await sendEmail(
                recipient,
                'Scheduled Report',
                'Please find your scheduled report attached.',
                exportedReport
              );
            } catch (emailError) {
              logger.error(`Failed to send report to ${recipient}:`, emailError);
            }
          }

          // Update last run and next run
          await prisma.scheduledReport.update({
            where: { id: scheduledReport.id },
            data: {
              lastRunAt: new Date(),
              nextRunAt: this.calculateNextRun(scheduledReport.schedule, scheduledReport.scheduleConfig as any),
            },
          });

          executed++;
        } catch (error: any) {
          failed++;
          logger.error(`Failed to execute scheduled report ${scheduledReport.id}:`, error);
        }
      }

      return { executed, failed };
    } catch (error: any) {
      logger.error('Error executing scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Export report in various formats
   */
  async exportReport(reportData: any, format: 'PDF' | 'EXCEL' | 'CSV' | 'HTML'): Promise<Buffer | string> {
    try {
      switch (format) {
        case 'PDF':
          return await this.exportToPDF(reportData);
        case 'EXCEL':
          return await this.exportToExcel(reportData);
        case 'CSV':
          return await this.exportToCSV(reportData);
        case 'HTML':
          return await this.exportToHTML(reportData);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error: any) {
      logger.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(reportData: any): Promise<Buffer> {
    // Use PDFKit or similar library
    // For now, return mock
    logger.info('Exporting report to PDF');
    return Buffer.from('PDF content');
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(reportData: any): Promise<Buffer> {
    // Use exceljs or similar library
    logger.info('Exporting report to Excel');
    return Buffer.from('Excel content');
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(reportData: any): Promise<string> {
    // Convert report data to CSV format
    logger.info('Exporting report to CSV');
    return 'CSV content';
  }

  /**
   * Export to HTML
   */
  private async exportToHTML(reportData: any): Promise<string> {
    // Convert report data to HTML format
    logger.info('Exporting report to HTML');
    return '<html><body>Report content</body></html>';
  }

  /**
   * Get dashboard customization settings
   */
  async getDashboardSettings(tenantId: string, userId?: string): Promise<any> {
    try {
      const settings = await prisma.dashboardSettings.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: userId || null,
          },
        },
      });

      if (settings) {
        return {
          widgets: settings.widgets as any,
          layout: settings.layout as any,
        };
      }

      // Return default settings if not found
      return {
        widgets: [
          { id: 'sales-overview', position: { x: 0, y: 0 }, size: { w: 4, h: 2 } },
          { id: 'top-products', position: { x: 4, y: 0 }, size: { w: 4, h: 2 } },
          { id: 'recent-orders', position: { x: 0, y: 2 }, size: { w: 8, h: 3 } },
        ],
        layout: 'grid',
      };
    } catch (error: any) {
      logger.error('Error getting dashboard settings:', error);
      throw error;
    }
  }

  /**
   * Save dashboard customization settings
   */
  async saveDashboardSettings(tenantId: string, userId: string | undefined, settings: any): Promise<void> {
    try {
      await prisma.dashboardSettings.upsert({
        where: {
          tenantId_userId: {
            tenantId,
            userId: userId || null,
          },
        },
        create: {
          tenantId,
          userId: userId || null,
          layout: settings.layout || {},
          widgets: settings.widgets || [],
        },
        update: {
          layout: settings.layout || {},
          widgets: settings.widgets || [],
        },
      });

      logger.info('Dashboard settings saved:', settings);
    } catch (error: any) {
      logger.error('Error saving dashboard settings:', error);
      throw error;
    }
  }
}

export default new AdvancedReportingService();

