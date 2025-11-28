/**
 * Customer Engagement Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import customerEngagementService from '../../../src/services/customer-engagement.service';
import prisma from '../../../src/config/database';

// Mock Prisma
vi.mock('../../../src/config/database', () => ({
  default: {
    order: {
      findMany: vi.fn(),
    },
    emailEvent: {
      findMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
  },
}));

describe('CustomerEngagementService', () => {
  const mockTenantId = 'tenant-123';
  const mockCustomerId = 'customer-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCustomerEngagement', () => {
    it('should calculate engagement metrics for a customer', async () => {
      const mockOrders = [
        {
          total: 100000,
          createdAt: new Date('2024-11-01T10:00:00Z'),
        },
        {
          total: 150000,
          createdAt: new Date('2024-11-15T10:00:00Z'),
        },
      ];

      const mockEmailEvents = [
        { eventType: 'SENT' },
        { eventType: 'SENT' },
        { eventType: 'OPENED' },
        { eventType: 'CLICKED' },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.emailEvent.findMany as any).mockResolvedValue(mockEmailEvents);
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: mockCustomerId,
        email: 'test@example.com',
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);

      const result = await customerEngagementService.getCustomerEngagement(
        mockTenantId,
        mockCustomerId
      );

      expect(result).toHaveProperty('customerId', mockCustomerId);
      expect(result).toHaveProperty('totalOrders', 2);
      expect(result).toHaveProperty('totalSpent', 250000);
      expect(result).toHaveProperty('engagementScore');
      expect(result).toHaveProperty('engagementLevel');
      expect(result.engagementLevel).toMatch(/HIGH|MEDIUM|LOW|INACTIVE/);
    });

    it('should return INACTIVE level for customer with no orders', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.emailEvent.findMany as any).mockResolvedValue([]);
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: mockCustomerId,
        email: 'test@example.com',
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);

      const result = await customerEngagementService.getCustomerEngagement(
        mockTenantId,
        mockCustomerId
      );

      expect(result.totalOrders).toBe(0);
      expect(result.engagementLevel).toBe('INACTIVE');
      expect(result.engagementScore).toBeLessThan(10);
    });
  });

  describe('getAllCustomersEngagement', () => {
    it('should get engagement metrics for all customers', async () => {
      const mockCustomers = [
        { id: 'customer-1' },
        { id: 'customer-2' },
      ];

      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.emailEvent.findMany as any).mockResolvedValue([]);
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: 'customer-1',
        email: 'test@example.com',
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);

      const result = await customerEngagementService.getAllCustomersEngagement(mockTenantId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('engagementScore');
    });

    it('should respect limit parameter', async () => {
      const mockCustomers = [{ id: 'customer-1' }];

      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.emailEvent.findMany as any).mockResolvedValue([]);
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: 'customer-1',
        email: 'test@example.com',
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);

      const result = await customerEngagementService.getAllCustomersEngagement(mockTenantId, 1);

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        take: 1,
        select: { id: true },
      });
      expect(result.length).toBe(1);
    });
  });

  describe('getOverallEngagementStats', () => {
    it('should calculate overall engagement statistics', async () => {
      const mockCustomers = [
        { id: 'customer-1' },
        { id: 'customer-2' },
      ];

      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.emailEvent.findMany as any).mockResolvedValue([]);
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: 'customer-1',
        email: 'test@example.com',
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);

      const result = await customerEngagementService.getOverallEngagementStats(mockTenantId);

      expect(result).toHaveProperty('totalCustomers');
      expect(result).toHaveProperty('high');
      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('low');
      expect(result).toHaveProperty('inactive');
      expect(result).toHaveProperty('averageEngagementScore');
      expect(result).toHaveProperty('distribution');
      expect(result.distribution).toHaveProperty('high');
      expect(result.distribution).toHaveProperty('medium');
      expect(result.distribution).toHaveProperty('low');
      expect(result.distribution).toHaveProperty('inactive');
    });
  });
});

