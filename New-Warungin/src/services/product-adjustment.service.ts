import prisma from '../config/database';
import { z } from 'zod';

export const createProductAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['INCREASE', 'DECREASE']),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
});

export type CreateProductAdjustmentInput = z.infer<typeof createProductAdjustmentSchema>;

export class ProductAdjustmentService {
  /**
   * Get all product adjustments for a tenant
   */
  async getAdjustments(tenantId: string, query: { page?: number; limit?: number; productId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(query.productId && { productId: query.productId }),
    };

    const [adjustments, total] = await Promise.all([
      prisma.productAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.productAdjustment.count({ where }),
    ]);

    return {
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a product adjustment
   * This will update the product stock and create an adjustment record
   */
  async createAdjustment(
    data: CreateProductAdjustmentInput,
    tenantId: string,
    userId: string
  ) {
    // Use transaction to ensure data consistency
    return prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findFirst({
        where: {
          id: data.productId,
          tenantId,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const stockBefore = product.stock;
      let stockAfter: number;

      // Calculate new stock
      if (data.type === 'INCREASE') {
        stockAfter = stockBefore + data.quantity;
      } else {
        // DECREASE
        stockAfter = Math.max(0, stockBefore - data.quantity);
      }

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: stockAfter },
      });

      // Create adjustment record
      const adjustment = await tx.productAdjustment.create({
        data: {
          tenantId,
          productId: data.productId,
          userId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          stockBefore,
          stockAfter,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return adjustment;
    });
  }

  /**
   * Get adjustment by ID
   */
  async getAdjustmentById(id: string, tenantId: string) {
    return prisma.productAdjustment.findFirst({
      where: { id, tenantId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export default new ProductAdjustmentService();

