/**
 * Unit tests for Order Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import orderService from '../../../src/services/order.service';
import prisma from '../../../src/config/database';
import CacheService from '../../../src/utils/cache';

// Mock CacheService
vi.mock('../../../src/utils/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        {
          id: 'order1',
          tenantId: 'tenant123',
          orderNumber: 'ORD-001',
          total: 50000,
          status: 'COMPLETED',
          items: [],
          customer: null,
        },
        {
          id: 'order2',
          tenantId: 'tenant123',
          orderNumber: 'ORD-002',
          total: 30000,
          status: 'PENDING',
          items: [],
          customer: null,
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.order.count as any).mockResolvedValue(2);

      const result = await orderService.getOrders('tenant123', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.data).toEqual(mockOrders);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order1',
          tenantId: 'tenant123',
          orderNumber: 'ORD-001',
          status: 'COMPLETED',
          items: [],
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.order.count as any).mockResolvedValue(1);

      await orderService.getOrders('tenant123', {
        page: 1,
        limit: 10,
        status: 'COMPLETED',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant123',
            status: 'COMPLETED',
          }),
        })
      );
    });

    it('should filter orders by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.order.count as any).mockResolvedValue(0);

      await orderService.getOrders('tenant123', {
        page: 1,
        limit: 10,
        startDate,
        endDate,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant123',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getOrderById', () => {
    it('should return order by ID', async () => {
      const mockOrder = {
        id: 'order1',
        tenantId: 'tenant123',
        orderNumber: 'ORD-001',
        total: 50000,
        status: 'COMPLETED',
        items: [],
        customer: null,
      };

      (prisma.order.findFirst as any).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order1', 'tenant123');

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order1', tenantId: 'tenant123' },
        include: expect.any(Object),
      });
    });

    it('should return null when order not found', async () => {
      (prisma.order.findFirst as any).mockResolvedValue(null);

      const result = await orderService.getOrderById('nonexistent', 'tenant123');

      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [
          { productId: 'prod1', quantity: 2, price: 10000 },
        ],
        customerId: 'customer1',
      };

      const mockCreatedOrder = {
        id: 'order-new',
        tenantId: 'tenant123',
        orderNumber: 'ORD-003',
        total: 20000,
        status: 'PENDING',
        items: [],
        createdAt: new Date(),
      };

      (prisma.product.findMany as any).mockResolvedValue([
        { id: 'prod1', stock: 10, price: 10000 },
      ]);
      (prisma.order.create as any).mockResolvedValue(mockCreatedOrder);

      const result = await orderService.createOrder(
        orderData,
        'user123',
        'tenant123'
      );

      expect(result).toBeDefined();
      expect(prisma.order.create).toHaveBeenCalled();
    });
  });
});

