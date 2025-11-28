/**
 * Purchase Order Service
 * Manages purchase orders for inventory management
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import productService from './product.service';
import supplierService from './supplier.service';

interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: Date;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}

interface UpdatePurchaseOrderInput {
  status?: string;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity?: number;
    notes?: string;
  }>;
}

class PurchaseOrderService {
  /**
   * Generate unique order number
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await prisma.purchaseOrder.count({
      where: { tenantId },
    });
    return `PO-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Get all purchase orders for tenant
   */
  async getPurchaseOrders(tenantId: string, query: { page?: number; limit?: number; status?: string; supplierId?: string }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.status) {
        where.status = query.status;
      }
      if (query.supplierId) {
        where.supplierId = query.supplierId;
      }

      const [purchaseOrders, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
          where,
          skip,
          take: limit,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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
        prisma.purchaseOrder.count({ where }),
      ]);

      return {
        data: purchaseOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting purchase orders:', error);
      throw error;
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(id: string, tenantId: string) {
    try {
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id, tenantId },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      return purchaseOrder;
    } catch (error: any) {
      logger.error('Error getting purchase order:', error);
      throw error;
    }
  }

  /**
   * Create new purchase order
   */
  async createPurchaseOrder(tenantId: string, userId: string, data: CreatePurchaseOrderInput) {
    try {
      // Verify supplier exists
      await supplierService.getSupplierById(data.supplierId, tenantId);

      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      return await prisma.$transaction(async (tx) => {
        // Generate order number
        const orderNumber = await this.generateOrderNumber(tenantId);

        // Create purchase order
        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            tenantId,
            supplierId: data.supplierId,
            orderNumber,
            expectedDate: data.expectedDate,
            totalAmount,
            notes: data.notes,
            createdBy: userId,
            status: 'PENDING',
            items: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                notes: item.notes,
              })),
            },
          },
          include: {
            supplier: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return purchaseOrder;
      });
    } catch (error: any) {
      logger.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(id: string, tenantId: string, userId: string, data: UpdatePurchaseOrderInput) {
    try {
      const purchaseOrder = await this.getPurchaseOrderById(id, tenantId);

      // If updating to RECEIVED, update product stock
      if (data.status === 'RECEIVED' && purchaseOrder.status !== 'RECEIVED') {
        return await this.receivePurchaseOrder(id, tenantId, userId, data.receivedDate);
      }

      // Calculate new total if items updated
      let totalAmount = purchaseOrder.totalAmount;
      if (data.items) {
        totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      }

      return await prisma.$transaction(async (tx) => {
        // Update purchase order
        const updatedOrder = await tx.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: {
            status: data.status || purchaseOrder.status,
            expectedDate: data.expectedDate || purchaseOrder.expectedDate,
            notes: data.notes || purchaseOrder.notes,
            totalAmount,
            ...(data.status === 'APPROVED' && { approvedBy: userId }),
          },
        });

        // Update items if provided
        if (data.items) {
          // Delete existing items
          await tx.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: purchaseOrder.id },
          });

          // Create new items
          await tx.purchaseOrderItem.createMany({
            data: data.items.map(item => ({
              purchaseOrderId: purchaseOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              receivedQuantity: item.receivedQuantity || 0,
              notes: item.notes,
            })),
          });
        }

        return await this.getPurchaseOrderById(id, tenantId);
      });
    } catch (error: any) {
      logger.error('Error updating purchase order:', error);
      throw error;
    }
  }

  /**
   * Receive purchase order (update stock)
   */
  async receivePurchaseOrder(id: string, tenantId: string, userId: string, receivedDate?: Date) {
    try {
      const purchaseOrder = await this.getPurchaseOrderById(id, tenantId);

      if (purchaseOrder.status === 'RECEIVED') {
        throw new Error('Purchase order already received');
      }

      return await prisma.$transaction(async (tx) => {
        // Update stock for each item
        for (const item of purchaseOrder.items) {
          const receivedQty = item.receivedQuantity || item.quantity;
          if (receivedQty > 0) {
            await productService.updateStock(
              item.productId,
              receivedQty,
              tenantId,
              'add'
            );

            // Update received quantity
            await tx.purchaseOrderItem.update({
              where: { id: item.id },
              data: { receivedQuantity: receivedQty },
            });
          }
        }

        // Update purchase order status
        const updatedOrder = await tx.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: {
            status: 'RECEIVED',
            receivedDate: receivedDate || new Date(),
          },
        });

        return await this.getPurchaseOrderById(id, tenantId);
      });
    } catch (error: any) {
      logger.error('Error receiving purchase order:', error);
      throw error;
    }
  }

  /**
   * Cancel purchase order
   */
  async cancelPurchaseOrder(id: string, tenantId: string) {
    try {
      const purchaseOrder = await this.getPurchaseOrderById(id, tenantId);

      if (purchaseOrder.status === 'RECEIVED') {
        throw new Error('Cannot cancel received purchase order');
      }

      return await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: 'CANCELLED' },
      });
    } catch (error: any) {
      logger.error('Error cancelling purchase order:', error);
      throw error;
    }
  }
}

export default new PurchaseOrderService();

