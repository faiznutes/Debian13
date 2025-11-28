/**
 * Customer Engagement Enhancement Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import customerEngagementEnhancementService from '../../../src/services/customer-engagement-enhancement.service';
import prisma from '../../../src/config/database';

// Mock Prisma
vi.mock('../../../src/config/database', () => ({
  default: {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    discount: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    customerFeedback: {
      create: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    customerReview: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('CustomerEngagementEnhancementService', () => {
  const mockTenantId = 'tenant-123';
  const mockCustomerId = 'customer-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUpcomingBirthdays', () => {
    it('should get customers with upcoming birthdays', async () => {
      const mockCustomers = [
        {
          id: mockCustomerId,
          name: 'John Doe',
          email: 'john@example.com',
          birthday: new Date('1990-12-25'),
        },
      ];

      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);

      const result = await customerEngagementEnhancementService.getUpcomingBirthdays(
        mockTenantId,
        30
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(prisma.customer.findMany).toHaveBeenCalled();
    });
  });

  describe('submitFeedback', () => {
    it('should submit customer feedback', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        tenantId: mockTenantId,
        customerId: mockCustomerId,
        rating: 5,
        comment: 'Great service!',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customerFeedback.create as any).mockResolvedValue(mockFeedback);

      const result = await customerEngagementEnhancementService.submitFeedback(
        mockTenantId,
        {
          customerId: mockCustomerId,
          rating: 5,
          comment: 'Great service!',
        }
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(prisma.customerFeedback.create).toHaveBeenCalled();
    });
  });

  describe('getFeedback', () => {
    it('should get customer feedback with pagination', async () => {
      const mockFeedbacks = [
        {
          id: 'feedback-1',
          customerId: mockCustomerId,
          rating: 5,
          comment: 'Great service!',
        },
        {
          id: 'feedback-2',
          customerId: mockCustomerId,
          rating: 4,
          comment: 'Good service',
        },
      ];

      (prisma.customerFeedback.findMany as any).mockResolvedValue(mockFeedbacks);

      const result = await customerEngagementEnhancementService.getFeedback(
        mockTenantId,
        { page: 1, limit: 10 }
      );

      expect(result.data).toHaveLength(2);
      expect(prisma.customerFeedback.findMany).toHaveBeenCalled();
    });
  });

  describe('submitCustomerReview', () => {
    it('should submit a customer review', async () => {
      const mockReview = {
        id: 'review-123',
        tenantId: mockTenantId,
        customerId: mockCustomerId,
        productId: 'product-123',
        rating: 5,
        title: 'Great product!',
        comment: 'Very satisfied with the product',
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customerReview.create as any).mockResolvedValue(mockReview);

      const result = await customerEngagementEnhancementService.submitCustomerReview(
        mockTenantId,
        {
          customerId: mockCustomerId,
          productId: 'product-123',
          rating: 5,
          title: 'Great product!',
          comment: 'Very satisfied with the product',
        }
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.title).toBe('Great product!');
      expect(prisma.customerReview.create).toHaveBeenCalled();
    });
  });

  describe('getCustomerReviews', () => {
    it('should get customer reviews with pagination', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          customerId: mockCustomerId,
          productId: 'product-123',
          rating: 5,
          title: 'Great product!',
          comment: 'Very satisfied',
        },
      ];

      (prisma.customerReview.findMany as any).mockResolvedValue(mockReviews);

      const result = await customerEngagementEnhancementService.getCustomerReviews(
        mockTenantId,
        { page: 1, limit: 10 }
      );

      expect(result.data).toBeDefined();
      expect(prisma.customerReview.findMany).toHaveBeenCalled();
    });
  });
});

