/**
 * Stock Transfer Service
 * Manages stock transfers between outlets
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import productService from './product.service';

interface CreateStockTransferInput {
  fromOutletId: string;
  toOutletId: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

class StockTransferService {
  /**
   * Generate unique transfer number
   */
  private async generateTransferNumber(tenantId: string): Promise<string> {
    const count = await prisma.stockTransfer.count({
      where: { tenantId },
    });
    return `ST-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Get all stock transfers for tenant
   */
  async getStockTransfers(tenantId: string, query: { page?: number; limit?: number; status?: string; outletId?: string }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.status) {
        where.status = query.status;
      }
      if (query.outletId) {
        where.OR = [
          { fromOutletId: query.outletId },
          { toOutletId: query.outletId },
        ];
      }

      const [transfers, total] = await Promise.all([
        prisma.stockTransfer.findMany({
          where,
          skip,
          take: limit,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.stockTransfer.count({ where }),
      ]);

      return {
        data: transfers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting stock transfers:', error);
      throw error;
    }
  }

  /**
   * Get stock transfer by ID
   */
  async getStockTransferById(id: string, tenantId: string) {
    try {
      const transfer = await prisma.stockTransfer.findFirst({
        where: { id, tenantId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new Error('Stock transfer not found');
      }

      return transfer;
    } catch (error: any) {
      logger.error('Error getting stock transfer:', error);
      throw error;
    }
  }

  /**
   * Create new stock transfer
   */
  async createStockTransfer(tenantId: string, userId: string, data: CreateStockTransferInput) {
    try {
      if (data.fromOutletId === data.toOutletId) {
        throw new Error('From and to outlet cannot be the same');
      }

      return await prisma.$transaction(async (tx) => {
        // Generate transfer number
        const transferNumber = await this.generateTransferNumber(tenantId);

        // Verify products have enough stock (if tracking per outlet)
        // For now, we'll just create the transfer

        // Create stock transfer
        const transfer = await tx.stockTransfer.create({
          data: {
            tenantId,
            fromOutletId: data.fromOutletId,
            toOutletId: data.toOutletId,
            transferNumber,
            notes: data.notes,
            createdBy: userId,
            status: 'PENDING',
            items: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                receivedQuantity: 0,
                notes: item.notes,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return transfer;
      });
    } catch (error: any) {
      logger.error('Error creating stock transfer:', error);
      throw error;
    }
  }

  /**
   * Receive stock transfer
   */
  async receiveStockTransfer(id: string, tenantId: string, userId: string, receivedDate?: Date) {
    try {
      const transfer = await this.getStockTransferById(id, tenantId);

      if (transfer.status === 'COMPLETED') {
        throw new Error('Stock transfer already completed');
      }

      return await prisma.$transaction(async (tx) => {
        // Update stock for each item (add to destination outlet)
        for (const item of transfer.items) {
          const receivedQty = item.receivedQuantity || item.quantity;
          if (receivedQty > 0) {
            // Note: This assumes stock is tracked globally, not per outlet
            // If per-outlet tracking is needed, this needs to be enhanced
            await productService.updateStock(
              item.productId,
              receivedQty,
              tenantId,
              'add'
            );

            // Update received quantity
            await tx.stockTransferItem.update({
              where: { id: item.id },
              data: { receivedQuantity: receivedQty },
            });
          }
        }

        // Update transfer status
        const updatedTransfer = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'COMPLETED',
            receivedDate: receivedDate || new Date(),
            receivedBy: userId,
          },
        });

        return await this.getStockTransferById(id, tenantId);
      });
    } catch (error: any) {
      logger.error('Error receiving stock transfer:', error);
      throw error;
    }
  }

  /**
   * Cancel stock transfer
   */
  async cancelStockTransfer(id: string, tenantId: string) {
    try {
      const transfer = await this.getStockTransferById(id, tenantId);

      if (transfer.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed stock transfer');
      }

      return await prisma.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: 'CANCELLED' },
      });
    } catch (error: any) {
      logger.error('Error cancelling stock transfer:', error);
      throw error;
    }
  }
}

export default new StockTransferService();

