/**
 * Unit tests for Customer Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import customerService from '../../../src/services/customer.service';
import prisma from '../../../src/config/database';
import CacheService from '../../../src/utils/cache';

// Mock CacheService
vi.mock('../../../src/utils/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    deletePattern: vi.fn(),
  },
}));

describe('Customer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        {
          id: 'cust1',
          tenantId: 'tenant123',
          name: 'Customer A',
          phone: '081234567890',
          _count: { orders: 5 },
        },
        {
          id: 'cust2',
          tenantId: 'tenant123',
          name: 'Customer B',
          phone: '081234567891',
          _count: { orders: 3 },
        },
      ];

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.customer.count as any).mockResolvedValue(2);
      (prisma.order.groupBy as any).mockResolvedValue([
        { customerId: 'cust1', _sum: { total: 100000 } },
        { customerId: 'cust2', _sum: { total: 50000 } },
      ]);
      (CacheService.set as any).mockResolvedValue(true);

      const result = await customerService.getCustomers('tenant123', {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter customers by search term', async () => {
      const mockCustomers = [
        {
          id: 'cust1',
          tenantId: 'tenant123',
          name: 'Customer A',
          phone: '081234567890',
          _count: { orders: 5 },
        },
      ];

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.customer.count as any).mockResolvedValue(1);
      (prisma.order.groupBy as any).mockResolvedValue([]);
      (CacheService.set as any).mockResolvedValue(true);

      await customerService.getCustomers('tenant123', {
        page: 1,
        limit: 10,
        search: 'Customer A',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant123',
            OR: expect.arrayContaining([
              { name: { contains: 'Customer A', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        data: [{ id: 'cust1', name: 'Cached Customer' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (CacheService.get as any).mockResolvedValue(cachedData);

      const result = await customerService.getCustomers('tenant123', {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result).toEqual(cachedData);
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getCustomerById', () => {
    it('should return customer by ID', async () => {
      const mockCustomer = {
        id: 'cust1',
        tenantId: 'tenant123',
        name: 'Customer A',
        phone: '081234567890',
        orders: [],
        _count: { orders: 5 },
      };

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.customer.findFirst as any).mockResolvedValue(mockCustomer);
      (CacheService.set as any).mockResolvedValue(true);

      const result = await customerService.getCustomerById('cust1', 'tenant123');

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'cust1', tenantId: 'tenant123' },
        include: expect.any(Object),
      });
    });

    it('should return null when customer not found', async () => {
      (CacheService.get as any).mockResolvedValue(null);
      (prisma.customer.findFirst as any).mockResolvedValue(null);

      const result = await customerService.getCustomerById('nonexistent', 'tenant123');

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'New Customer',
        phone: '081234567890',
        email: 'new@example.com',
      };

      const mockCreatedCustomer = {
        id: 'cust-new',
        tenantId: 'tenant123',
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.create as any).mockResolvedValue(mockCreatedCustomer);
      (CacheService.deletePattern as any).mockResolvedValue(1);

      const result = await customerService.createCustomer(customerData, 'tenant123');

      expect(result).toEqual(mockCreatedCustomer);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...customerData,
          tenantId: 'tenant123',
        }),
      });
    });
  });
});

