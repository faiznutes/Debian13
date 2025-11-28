/**
 * Advanced Reporting Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import advancedReportingService from '../../../src/services/advanced-reporting.service';
import prisma from '../../../src/config/database';

// Mock Prisma
vi.mock('../../../src/config/database', () => ({
  default: {
    reportTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    scheduledReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dashboardSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('AdvancedReportingService', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReportTemplate', () => {
    it('should create a new report template', async () => {
      const mockTemplate = {
        id: 'template-123',
        tenantId: mockTenantId,
        name: 'Sales Report',
        description: 'Monthly sales report',
        type: 'SALES',
        config: {
          columns: [{ field: 'date', label: 'Date', type: 'date' }],
          filters: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.reportTemplate.create as any).mockResolvedValue(mockTemplate);

      const result = await advancedReportingService.createReportTemplate(
        mockTenantId,
        {
          name: 'Sales Report',
          description: 'Monthly sales report',
          type: 'SALES',
          config: {
            columns: [{ field: 'date', label: 'Date', type: 'date' }],
            filters: [],
          },
        }
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Sales Report');
      expect(prisma.reportTemplate.create).toHaveBeenCalled();
    });
  });

  describe('getReportTemplates', () => {
    it('should get all report templates with pagination', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Sales Report',
          type: 'SALES',
        },
        {
          id: 'template-2',
          name: 'Inventory Report',
          type: 'INVENTORY',
        },
      ];

      (prisma.reportTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const result = await advancedReportingService.getReportTemplates(
        mockTenantId,
        { page: 1, limit: 10 }
      );

      expect(result.data).toHaveLength(2);
      expect(prisma.reportTemplate.findMany).toHaveBeenCalled();
    });
  });

  describe('createScheduledReport', () => {
    it('should create a scheduled report', async () => {
      const mockScheduledReport = {
        id: 'scheduled-123',
        tenantId: mockTenantId,
        templateId: 'template-123',
        schedule: 'MONTHLY',
        scheduleConfig: null,
        recipients: ['user@example.com'],
        nextRun: new Date('2024-12-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.scheduledReport.create as any).mockResolvedValue(mockScheduledReport);

      const result = await advancedReportingService.createScheduledReport(
        mockTenantId,
        {
          templateId: 'template-123',
          schedule: 'MONTHLY',
          recipients: ['user@example.com'],
        }
      );

      expect(result).toBeDefined();
      expect(result.schedule).toBe('MONTHLY');
      expect(prisma.scheduledReport.create).toHaveBeenCalled();
    });
  });

  describe('getDashboardSettings', () => {
    it('should get dashboard settings for a user', async () => {
      const mockSettings = {
        id: 'settings-123',
        tenantId: mockTenantId,
        userId: mockUserId,
        layout: 'grid',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardSettings.findUnique as any).mockResolvedValue(mockSettings);

      const result = await advancedReportingService.getDashboardSettings(
        mockTenantId,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result.layout).toBe('grid');
      expect(prisma.dashboardSettings.findUnique).toHaveBeenCalled();
    });
  });
});

