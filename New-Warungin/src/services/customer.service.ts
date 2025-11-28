import { PrismaClient, Customer } from '@prisma/client';
import { CreateCustomerInput, UpdateCustomerInput, GetCustomersQuery } from '../validators/customer.validator';
import prisma from '../config/database';
import CacheService from '../utils/cache';
import logger from '../utils/logger';

export class CustomerService {
  async getCustomers(tenantId: string, query: GetCustomersQuery, useCache: boolean = true) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Create cache key
    const cacheKey = `customers:${tenantId}:${JSON.stringify({ page, limit, search, sortBy, sortOrder })}`;

    // Try to get from cache first
    if (useCache) {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const where: any = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Optimize: Get all customer totals in one query instead of N queries (fix N+1)
    const customerIds = customers.map(c => c.id);
    const customerTotals = customerIds.length > 0
      ? await prisma.order.groupBy({
          by: ['customerId'],
          where: {
            tenantId,
            customerId: { in: customerIds },
            status: 'COMPLETED',
          },
          _sum: { total: true },
        })
      : [];

    // Create a map for O(1) lookup
    const totalsMap = new Map(
      customerTotals.map(item => [item.customerId!, Number(item._sum.total || 0)])
    );

    // Calculate total spent for each customer (using the map)
    const customersWithStats = customers.map((customer) => ({
      ...customer,
      totalSpent: totalsMap.get(customer.id) || 0,
      totalOrders: customer._count.orders,
    }));

    const result = {
      data: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result (5 minutes TTL)
    if (useCache) {
      await CacheService.set(cacheKey, result, 300);
    }

    return result;
  }

  async getCustomerById(id: string, tenantId: string, useCache: boolean = true): Promise<Customer | null> {
    const cacheKey = `customer:${tenantId}:${id}`;

    // Try to get from cache first
    if (useCache) {
      const cached = await CacheService.get<Customer | null>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Cache the result (5 minutes TTL)
    if (useCache && customer) {
      await CacheService.set(cacheKey, customer, 300);
    }

    return customer;
  }

  async createCustomer(data: CreateCustomerInput, tenantId: string): Promise<Customer> {
    try {
      const customer = await prisma.customer.create({
        data: {
          ...data,
          tenantId,
        },
      });

      // Invalidate analytics cache after customer creation
      await this.invalidateAnalyticsCache(tenantId);

      return customer;
    } catch (error: any) {
      // Log the error for debugging
      console.error('Prisma error in createCustomer:', error);
      // Re-throw with more context
      if (error.code === 'P1001' || error.code === 'P1002' || error.message?.includes('connect')) {
        throw new Error('Database connection failed. Please try again.');
      }
      throw error;
    }
  }

  async updateCustomer(id: string, data: UpdateCustomerInput, tenantId: string): Promise<Customer> {
    const customer = await this.getCustomerById(id, tenantId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data,
    });

    // Invalidate analytics cache after customer update
    await this.invalidateAnalyticsCache(tenantId);

    return updatedCustomer;
  }

  async deleteCustomer(id: string, tenantId: string): Promise<void> {
    const customer = await this.getCustomerById(id, tenantId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await prisma.customer.delete({
      where: { id },
    });

    // Invalidate analytics cache after customer deletion
    await this.invalidateAnalyticsCache(tenantId);
  }

  /**
   * Invalidate cache for a tenant after customer operations
   */
  private async invalidateAnalyticsCache(tenantId: string): Promise<void> {
    try {
      // Invalidate customer and analytics cache
      await CacheService.deletePattern(`customers:${tenantId}:*`);
      await CacheService.deletePattern(`customer:${tenantId}:*`);
      await CacheService.deletePattern(`analytics:*:${tenantId}`);
      await CacheService.deletePattern(`analytics:${tenantId}:*`);
      await CacheService.deletePattern(`dashboard:${tenantId}:*`);
      logger.info('Invalidated cache after customer operation', { tenantId });
    } catch (error: any) {
      logger.warn('Failed to invalidate cache', {
        error: error.message,
        tenantId
      });
    }
  }
}

export default new CustomerService();

