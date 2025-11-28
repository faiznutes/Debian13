/**
 * Integration tests for Customer Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import prisma from '../../../src/config/database';
import jwt from 'jsonwebtoken';
import env from '../../../src/config/env';
import CacheService from '../../../src/utils/cache';

// Mock dependencies
vi.mock('../../../src/config/database', () => ({
  default: {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    order: {
      groupBy: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(() => Promise.resolve([])),
    $disconnect: vi.fn(() => Promise.resolve()),
    $connect: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../../src/utils/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    deletePattern: vi.fn(),
  },
}));

describe('Customer Routes - Integration Tests', () => {
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

    (CacheService.get as any).mockResolvedValue(null);
    (CacheService.set as any).mockResolvedValue(true);
  });

  describe('GET /api/customers', () => {
    it('should return a list of customers for an authenticated user', async () => {
      const mockCustomers = [
        {
          id: 'cust1',
          tenantId: mockTenantId,
          name: 'Customer A',
          phone: '081234567890',
          _count: { orders: 5 },
        },
      ];

      (prisma.customer.findMany as any).mockResolvedValue(mockCustomers);
      (prisma.customer.count as any).mockResolvedValue(1);
      (prisma.order.groupBy as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/customers');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return a customer by ID', async () => {
      const mockCustomer = {
        id: 'cust1',
        tenantId: mockTenantId,
        name: 'Customer A',
        phone: '081234567890',
        orders: [],
        _count: { orders: 5 },
      };

      (prisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get('/api/customers/cust1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCustomer);
    });

    it('should return 404 when customer not found', async () => {
      (prisma.customer.findFirst as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/customers/nonexistent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'New Customer',
        phone: '081234567890',
      };

      const mockCreatedCustomer = {
        id: 'cust-new',
        tenantId: mockTenantId,
        ...customerData,
        createdAt: new Date(),
      };

      (prisma.customer.create as any).mockResolvedValue(mockCreatedCustomer);
      (CacheService.deletePattern as any).mockResolvedValue(1);

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(customerData);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe(customerData.name);
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' }); // Invalid: missing required fields

      expect(response.statusCode).toBe(400);
    });
  });
});

