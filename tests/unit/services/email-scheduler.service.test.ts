/**
 * Email Scheduler Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import emailSchedulerService from '../../../src/services/email-scheduler.service';
import prisma from '../../../src/config/database';

// Mock Prisma
vi.mock('../../../src/config/database', () => ({
  default: {
    scheduledEmail: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock marketing service
vi.mock('../../../src/services/marketing.service', () => ({
  default: {
    sendEmailCampaign: vi.fn(),
  },
}));

describe('EmailSchedulerService', () => {
  const mockTenantId = 'tenant-123';
  const mockCustomerId = 'customer-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleCampaign', () => {
    it('should schedule a campaign successfully', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        tenantId: mockTenantId,
        campaignId: 'campaign-123',
        scheduledAt: new Date('2024-12-01T10:00:00Z'),
        target: 'ALL',
        subject: 'Test Campaign',
        content: 'Test content',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.scheduledEmail.create as any).mockResolvedValue(mockSchedule);

      const result = await emailSchedulerService.scheduleCampaign(mockTenantId, {
        campaignId: 'campaign-123',
        scheduledAt: new Date('2024-12-01T10:00:00Z'),
        target: 'ALL',
        subject: 'Test Campaign',
        content: 'Test content',
      });

      expect(result).toEqual(mockSchedule);
      expect(prisma.scheduledEmail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          campaignId: 'campaign-123',
          target: 'ALL',
          subject: 'Test Campaign',
          content: 'Test content',
          status: 'PENDING',
        }),
      });
    });

    it('should throw error if scheduled time is in the past', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');

      await expect(
        emailSchedulerService.scheduleCampaign(mockTenantId, {
          campaignId: 'campaign-123',
          scheduledAt: pastDate,
          target: 'ALL',
          subject: 'Test Campaign',
          content: 'Test content',
        })
      ).rejects.toThrow('Scheduled time must be in the future');
    });
  });

  describe('getScheduledCampaigns', () => {
    it('should get all scheduled campaigns', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          tenantId: mockTenantId,
          status: 'PENDING',
          scheduledAt: new Date('2024-12-01T10:00:00Z'),
        },
        {
          id: 'schedule-2',
          tenantId: mockTenantId,
          status: 'SENT',
          scheduledAt: new Date('2024-12-02T10:00:00Z'),
        },
      ];

      (prisma.scheduledEmail.findMany as any).mockResolvedValue(mockSchedules);

      const result = await emailSchedulerService.getScheduledCampaigns(mockTenantId);

      expect(result).toEqual(mockSchedules);
      expect(prisma.scheduledEmail.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        orderBy: { scheduledAt: 'asc' },
      });
    });

    it('should filter by status if provided', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          tenantId: mockTenantId,
          status: 'PENDING',
        },
      ];

      (prisma.scheduledEmail.findMany as any).mockResolvedValue(mockSchedules);

      const result = await emailSchedulerService.getScheduledCampaigns(mockTenantId, 'PENDING');

      expect(result).toEqual(mockSchedules);
      expect(prisma.scheduledEmail.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, status: 'PENDING' },
        orderBy: { scheduledAt: 'asc' },
      });
    });
  });

  describe('cancelSchedule', () => {
    it('should cancel a scheduled campaign', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        tenantId: mockTenantId,
        status: 'PENDING',
      };

      (prisma.scheduledEmail.findFirst as any).mockResolvedValue(mockSchedule);
      (prisma.scheduledEmail.update as any).mockResolvedValue({
        ...mockSchedule,
        status: 'CANCELLED',
      });

      const result = await emailSchedulerService.cancelSchedule('schedule-123', mockTenantId);

      expect(result.status).toBe('CANCELLED');
      expect(prisma.scheduledEmail.update).toHaveBeenCalledWith({
        where: { id: 'schedule-123' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should throw error if trying to cancel already sent campaign', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        tenantId: mockTenantId,
        status: 'SENT',
      };

      (prisma.scheduledEmail.findFirst as any).mockResolvedValue(mockSchedule);

      await expect(
        emailSchedulerService.cancelSchedule('schedule-123', mockTenantId)
      ).rejects.toThrow('Cannot cancel already sent campaign');
    });
  });
});

