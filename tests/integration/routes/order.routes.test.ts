/**
 * Integration tests for Order Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import prisma from '../../../src/config/database';
import jwt from 'jsonwebtoken';
import env from '../../../src/config/env';

// Mock dependencies
vi.mock('../../../src/config/database', () => ({
  default: {
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(() => Promise.resolve([])),
    $disconnect: vi.fn(() => Promise.resolve()),
    $connect: vi.fn(() => Promise.resolve()),
  },
}));

describe('Order Routes - Integration Tests', () => {
  let accessToken: string;
  const mockTenantId = 'tenant123';
  const mockUserId = 'user123';

  beforeEach(() => {
    vi.clearAllMocks();
    accessToken = jwt.sign(
      { userId: mockUserId, tenantId: mockTenantId, role: 'ADMIN_TENANT' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: mockTenantId,
      isActive: true,
      subscriptionPlan: 'PRO',
    });
  });

  describe('GET /api/orders', () => {
    it('should return a list of orders for an authenticated user', async () => {
      const mockOrders = [
        {
          id: 'order1',
          tenantId: mockTenantId,
          orderNumber: 'ORD-001',
          total: 50000,
          status: 'COMPLETED',
          items: [],
          customer: null,
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.order.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual(mockOrders);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/orders');

      expect(response.statusCode).toBe(401);
    });

    it('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order1',
          tenantId: mockTenantId,
          status: 'COMPLETED',
          items: [],
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.order.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/orders?status=COMPLETED')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            status: 'COMPLETED',
          }),
        })
      );
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return an order by ID', async () => {
      const mockOrder = {
        id: 'order1',
        tenantId: mockTenantId,
        orderNumber: 'ORD-001',
        total: 50000,
        status: 'COMPLETED',
        items: [],
      };

      (prisma.order.findFirst as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/orders/order1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockOrder);
    });

    it('should return 404 when order not found', async () => {
      (prisma.order.findFirst as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/nonexistent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});

