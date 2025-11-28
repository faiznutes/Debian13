/**
 * Unit tests for Product Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import productService from '../../../src/services/product.service';
import prisma from '../../../src/config/database';
import CacheService from '../../../src/utils/cache';

// Mock CacheService
vi.mock('../../../src/utils/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          tenantId: 'tenant123',
          name: 'Product A',
          price: 10000,
          stock: 10,
          isActive: true,
        },
        {
          id: 'prod2',
          tenantId: 'tenant123',
          name: 'Product B',
          price: 20000,
          stock: 5,
          isActive: true,
        },
      ];

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(2);
      (CacheService.set as any).mockResolvedValue(true);

      const result = await productService.getProducts('tenant123', {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant123', isArchived: false },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should filter products by search term', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          tenantId: 'tenant123',
          name: 'Product A',
          price: 10000,
          stock: 10,
        },
      ];

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(1);
      (CacheService.set as any).mockResolvedValue(true);

      const result = await productService.getProducts('tenant123', {
        page: 1,
        limit: 10,
        search: 'Product A',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant123',
            OR: expect.arrayContaining([
              { name: { contains: 'Product A', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        data: [{ id: 'prod1', name: 'Cached Product' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (CacheService.get as any).mockResolvedValue(cachedData);

      const result = await productService.getProducts('tenant123', {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result).toEqual(cachedData);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should filter products by category', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          tenantId: 'tenant123',
          name: 'Product A',
          category: 'Electronics',
          price: 10000,
          stock: 10,
        },
      ];

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(1);
      (CacheService.set as any).mockResolvedValue(true);

      await productService.getProducts('tenant123', {
        page: 1,
        limit: 10,
        category: 'Electronics',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant123',
            category: 'Electronics',
          }),
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: 'prod1',
        tenantId: 'tenant123',
        name: 'Product A',
        price: 10000,
        stock: 10,
      };

      (CacheService.get as any).mockResolvedValue(null);
      (prisma.product.findFirst as any).mockResolvedValue(mockProduct);
      (CacheService.set as any).mockResolvedValue(true);

      const result = await productService.getProductById('prod1', 'tenant123');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod1', tenantId: 'tenant123' },
      });
    });

    it('should return null when product not found', async () => {
      (CacheService.get as any).mockResolvedValue(null);
      (prisma.product.findFirst as any).mockResolvedValue(null);

      const result = await productService.getProductById('nonexistent', 'tenant123');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        price: 15000,
        stock: 20,
        category: 'Electronics',
      };

      const mockCreatedProduct = {
        id: 'prod-new',
        tenantId: 'tenant123',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.create as any).mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct(productData, 'tenant123');

      expect(result).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...productData,
          tenantId: 'tenant123',
        }),
      });
    });
  });
});

