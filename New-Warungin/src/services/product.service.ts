import { PrismaClient, Product } from '@prisma/client';
import { CreateProductInput, UpdateProductInput, GetProductsQuery } from '../validators/product.validator';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';

export class ProductService {
  async getProducts(tenantId: string, query: GetProductsQuery, useCache: boolean = true) {
    const { page, limit, search, category, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Create cache key based on query parameters
    const cacheKey = `products:${tenantId}:${JSON.stringify({ page, limit, search, category, isActive, sortBy, sortOrder })}`;

    // Try to get from cache first
    if (useCache) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (error) {
          // If cache read fails, continue with database query
          console.warn('Failed to read products from cache:', error);
        }
      }
    }

    const where: any = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result (5 minutes TTL for products list)
    if (useCache) {
      const redis = getRedisClient();
      if (redis) {
        try {
          await redis.setex(cacheKey, 300, JSON.stringify(result));
        } catch (error) {
          // If cache write fails, continue without caching
          console.warn('Failed to cache products:', error);
        }
      }
    }

    return result;
  }

  async getProductById(id: string, tenantId: string, useCache: boolean = true): Promise<Product | null> {
    const cacheKey = `product:${tenantId}:${id}`;

    // Try to get from cache first
    if (useCache) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (error) {
          // If cache read fails, continue with database query
          console.warn('Failed to read product from cache:', error);
        }
      }
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    // Cache the result (10 minutes TTL for individual product)
    if (product && useCache) {
      const redis = getRedisClient();
      if (redis) {
        try {
          await redis.setex(cacheKey, 600, JSON.stringify(product));
        } catch (error) {
          // If cache write fails, continue without caching
          console.warn('Failed to cache product:', error);
        }
      }
    }

    return product;
  }

  async createProduct(data: CreateProductInput, tenantId: string): Promise<Product> {
    // Check limit using plan-features service (includes base plan + addons)
    const planFeaturesService = (await import('./plan-features.service')).default;
    const limitCheck = await planFeaturesService.checkPlanLimit(tenantId, 'products');
    
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message || `Product limit reached (${limitCheck.currentUsage}/${limitCheck.limit}). Upgrade your plan or addon to add more products.`);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    });

    // Invalidate cache for products list
    await this.invalidateProductCache(tenantId);

    return product;
  }

  /**
   * Invalidate product cache for a tenant
   */
  private async invalidateProductCache(tenantId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      try {
        // Delete all product-related cache keys for this tenant
        const keys = await redis.keys(`products:${tenantId}:*`);
        const productKeys = await redis.keys(`product:${tenantId}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        if (productKeys.length > 0) {
          await redis.del(...productKeys);
        }
      } catch (error) {
        // If cache invalidation fails, log but don't throw
        console.warn('Failed to invalidate product cache:', error);
      }
    }
  }

  async updateProduct(id: string, data: UpdateProductInput, tenantId: string): Promise<Product> {
    // Verify product belongs to tenant
    const product = await this.getProductById(id, tenantId, false); // Don't use cache for verification
    if (!product) {
      throw new Error('Product not found');
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.invalidateProductCache(tenantId);

    return updatedProduct;
  }

  async deleteProduct(id: string, tenantId: string): Promise<void> {
    // Verify product belongs to tenant
    const product = await this.getProductById(id, tenantId, false); // Don't use cache for verification
    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateProductCache(tenantId);
  }

  async updateStock(id: string, quantity: number, tenantId: string, operation: 'add' | 'subtract' | 'set' = 'set', emitSocketEvent: boolean = false): Promise<Product> {
    const product = await this.getProductById(id, tenantId, false); // Don't use cache for verification
    if (!product) {
      throw new Error('Product not found');
    }

    let newStock: number;
    switch (operation) {
      case 'add':
        newStock = product.stock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, product.stock - quantity);
        break;
      case 'set':
      default:
        newStock = quantity;
        break;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    // Invalidate cache for this product and products list
    await this.invalidateProductCache(tenantId);
    
    // Also invalidate analytics cache that depends on products
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.del(`analytics:top-products:${tenantId}`);
      }
    } catch (error) {
      console.warn('Failed to invalidate analytics cache:', error);
    }

    // Emit socket event if requested (usually from order service, not from direct product update)
    if (emitSocketEvent) {
      try {
        const { emitToTenant } = await import('../socket/socket');
        emitToTenant(tenantId, 'product:stock-update', {
          productId: id,
          stock: updatedProduct.stock,
        });
      } catch (error) {
        // Ignore socket errors
        console.warn('Failed to emit stock update socket event:', error);
      }
    }

    return updatedProduct;
  }

  async getLowStockProducts(tenantId: string): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stock: {
          lte: prisma.product.fields.minStock,
        },
      },
      orderBy: { stock: 'asc' },
    });
  }
}

export default new ProductService();

