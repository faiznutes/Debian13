/**
 * Integration tests for Product Routes
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
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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
  },
}));

describe('Product Routes - Integration Tests', () => {
  let accessToken: string;
  const mockTenantId = 'tenant123';
  const mockUserId = 'user123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Generate a mock access token for authenticated requests
    accessToken = jwt.sign(
      { userId: mockUserId, tenantId: mockTenantId, role: 'ADMIN_TENANT' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Mock tenant check in middleware
    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: mockTenantId,
      isActive: true,
      subscriptionPlan: 'PRO',
    });

    // Mock cache
    (CacheService.get as any).mockResolvedValue(null);
    (CacheService.set as any).mockResolvedValue(true);
  });

  describe('GET /api/products', () => {
    it('should return a list of products for an authenticated user', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          tenantId: mockTenantId,
          name: 'Product A',
          price: 10000,
          stock: 10,
          category: 'Electronics',
        },
        {
          id: 'prod2',
          tenantId: mockTenantId,
          name: 'Product B',
          price: 20000,
          stock: 5,
          category: 'Food',
        },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(mockProducts.length);

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual(mockProducts);
      expect(response.body.pagination.total).toBe(mockProducts.length);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/products');

      expect(response.statusCode).toBe(401);
    });

    it('should filter products by search term', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          tenantId: mockTenantId,
          name: 'Product A',
          price: 10000,
          stock: 10,
        },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/products?search=Product A')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({ contains: 'Product A' }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      const mockProduct = {
        id: 'prod1',
        tenantId: mockTenantId,
        name: 'Product A',
        price: 10000,
        stock: 10,
      };

      (prisma.product.findFirst as any).mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/prod1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockProduct);
    });

    it('should return 404 when product not found', async () => {
      (prisma.product.findFirst as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/nonexistent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        price: 15000,
        stock: 20,
        category: 'Electronics',
      };

      const mockCreatedProduct = {
        id: 'prod-new',
        tenantId: mockTenantId,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.create as any).mockResolvedValue(mockCreatedProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(productData);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe(productData.name);
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' }); // Invalid: missing required fields

      expect(response.statusCode).toBe(400);
    });
  });
});
