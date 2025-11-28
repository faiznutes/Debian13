import { PrismaClient, Order, OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderInput, GetOrdersQuery, UpdateOrderStatusInput } from '../validators/order.validator';
import prisma from '../config/database';
import productService from './product.service';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export class OrderService {
  async getOrders(tenantId: string, query: GetOrdersQuery, userRole?: string) {
    const { page, limit, status, customerId, outletId, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Handle sendToKitchen filter (from query params)
    const sendToKitchen = (query as any).sendToKitchen;
    const kitchenStatus = (query as any).kitchenStatus;
    
    // Handle kitchenStatus filter (array or single value)
    let kitchenStatusWhere: any = undefined;
    if (kitchenStatus) {
      if (Array.isArray(kitchenStatus)) {
        kitchenStatusWhere = { in: kitchenStatus };
      } else {
        kitchenStatusWhere = kitchenStatus;
      }
    }

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(outletId && { outletId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: (() => {
            // If endDate is a date string (YYYY-MM-DD), set to end of day (23:59:59)
            const endDateObj = new Date(endDate);
            // Check if it's a date string (no time component)
            if (endDate.includes('T') || endDate.includes(' ')) {
              // Already has time component, use as is
              return endDateObj;
            } else {
              // Date string only, set to end of day
              endDateObj.setHours(23, 59, 59, 999);
              return endDateObj;
            }
          })(),
        },
      }),
      // Filter by sendToKitchen if explicitly requested
      ...(sendToKitchen === true || sendToKitchen === 'true' ? { sendToKitchen: true } : {}),
      // Kitchen users only see orders sent to kitchen
      ...(userRole === 'KITCHEN' && { sendToKitchen: true }),
      // Filter by kitchenStatus if provided
      ...(kitchenStatusWhere && { kitchenStatus: kitchenStatusWhere }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          member: true,
          outlet: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string, tenantId: string): Promise<Order | null> {
    return prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        member: true,
        outlet: true,
        transaction: true, // Include transaction untuk mendapatkan servedBy
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

  async createOrder(data: CreateOrderInput, userId: string, tenantId: string): Promise<Order> {
    // Calculate subtotal from items (before any discounts)
    const subtotal = data.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Apply automatic discounts (from discount rules)
    let autoDiscount = 0;
    try {
      const discountService = (await import('./discount.service')).default;
      const autoDiscountResult = await discountService.applyDiscounts(
        tenantId,
        data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal
      );
      autoDiscount = autoDiscountResult.discountAmount;
    } catch (error: any) {
      // If discount service fails (e.g., table doesn't exist yet), continue without auto discount
      console.warn('Failed to apply automatic discounts:', error.message);
      autoDiscount = 0;
    }

    // Calculate subtotal after auto discount
    const subtotalAfterAutoDiscount = subtotal - autoDiscount;

    // Apply member discount if exists (calculated from subtotal after auto discount)
    let memberDiscount = 0;
    if (data.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
      });
      if (member && member.isActive && member.discountType && member.discountValue) {
        if (member.discountType === 'PERCENTAGE') {
          memberDiscount = (subtotalAfterAutoDiscount * Number(member.discountValue)) / 100;
        } else {
          memberDiscount = Number(member.discountValue);
        }
      }
    }

    // Apply manual order discount (if any)
    const manualDiscount = data.discount || 0;
    
    // Calculate final total
    const total = subtotalAfterAutoDiscount - memberDiscount - manualDiscount;
    
    // Total discount for order record
    const totalDiscount = autoDiscount + memberDiscount + manualDiscount;

    // Create order with items in transaction
    return prisma.$transaction(async (tx) => {
      // Get tenant info for order number generation
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Generate tenant initials (3 letters, uppercase)
      const tenantName = tenant.name || 'TENANT';
      const initials = tenantName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3)
        .padEnd(3, 'X'); // Pad with X if less than 3 characters

      // Get the latest order number for this tenant to determine next sequence
      const latestOrder = await tx.order.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      let sequence = 1;
      if (latestOrder && latestOrder.orderNumber) {
        // Extract sequence from existing order number (format: PDG-001-ABC)
        const match = latestOrder.orderNumber.match(/^[A-Z]{3}-(\d+)-[A-Z]{3}$/);
        if (match) {
          sequence = parseInt(match[1], 10) + 1;
        } else {
          // If format doesn't match, count all orders
          const orderCount = await tx.order.count({
            where: { tenantId },
          });
          sequence = orderCount + 1;
        }
      }

      // Generate unique random letters (exactly 3 characters)
      let uniqueLetters = Math.random().toString(36).substring(2, 5).toUpperCase();
      // Ensure exactly 3 characters
      while (uniqueLetters.length < 3) {
        uniqueLetters += Math.random().toString(36).substring(2, 1).toUpperCase();
      }
      uniqueLetters = uniqueLetters.substring(0, 3);

      // Generate order number: [INITIALS]-[SEQUENCE]-[UNIQUE_LETTERS]
      // Format: PDG-001-ABC (sequence with leading zeros, always 3 digits)
      const sequenceStr = sequence.toString().padStart(3, '0');
      let orderNumber = `${initials}-${sequenceStr}-${uniqueLetters}`;

      // Ensure uniqueness by checking if order number already exists
      let retryCount = 0;
      while (retryCount < 10) {
        const existingOrder = await tx.order.findUnique({
          where: { orderNumber },
        });

        if (!existingOrder) {
          break; // Order number is unique
        }

        // If duplicate, generate new unique letters (exactly 3 characters)
        uniqueLetters = Math.random().toString(36).substring(2, 5).toUpperCase();
        while (uniqueLetters.length < 3) {
          uniqueLetters += Math.random().toString(36).substring(2, 1).toUpperCase();
        }
        uniqueLetters = uniqueLetters.substring(0, 3);
        orderNumber = `${initials}-${sequenceStr}-${uniqueLetters}`;
        retryCount++;
      }

      if (retryCount >= 10) {
        throw new Error('Failed to generate unique order number after multiple attempts');
      }
      // Verify and update product stock
      for (const item of data.items) {
        const product = await productService.getProductById(item.productId, tenantId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
        }
      }

      // Prepare order items with cost and profit calculation
      const orderItemsData = await Promise.all(
        data.items.map(async (item) => {
          // Get product to retrieve cost
          const product = await productService.getProductById(item.productId, tenantId);
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Get cost from product (if available)
          const cost = product.cost ? Number(product.cost) : null;
          
          // Calculate profit = (price - cost) * quantity (only if cost exists)
          const profit = cost !== null ? (item.price - cost) * item.quantity : null;

          return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
            cost: cost !== null ? cost.toString() : null,
            subtotal: (item.price * item.quantity).toString(),
            profit: profit !== null ? profit.toString() : null,
          };
        })
      );

      // Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          userId,
          orderNumber,
          customerId: data.customerId,
          memberId: data.memberId,
          temporaryCustomerName: data.temporaryCustomerName,
          outletId: data.outletId,
          subtotal: subtotal.toString(),
          discount: totalDiscount.toString(),
          total: total.toString(),
          status: 'PENDING',
          sendToKitchen: data.sendToKitchen || false,
          kitchenStatus: data.sendToKitchen ? 'PENDING' : null,
          notes: data.notes,
          items: {
            create: orderItemsData,
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

      // Update product stock and emit socket events
      for (const item of data.items) {
        const updatedProduct = await productService.updateStock(item.productId, item.quantity, tenantId, 'subtract');
        
        // Emit stock update via socket
        const { emitToTenant } = await import('../socket/socket');
        emitToTenant(tenantId, 'product:stock-update', {
          productId: item.productId,
          stock: updatedProduct.stock,
        });
      }

      // Emit order created event
      const { emitToTenant } = await import('../socket/socket');
      emitToTenant(tenantId, 'order:created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      // Invalidate analytics cache after order creation
      await this.invalidateAnalyticsCache(tenantId);

      return order;
    });
  }

  /**
   * Invalidate analytics cache for a tenant
   */
  private async invalidateAnalyticsCache(tenantId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (redis) {
        // Delete all analytics cache keys for this tenant
        const keys = await redis.keys(`analytics:*:${tenantId}`);
        const keys2 = await redis.keys(`analytics:${tenantId}:*`);
        const allKeys = [...keys, ...keys2];
        if (allKeys.length > 0) {
          await redis.del(...allKeys);
          logger.info('Invalidated analytics cache after order operation', {
            tenantId,
            cacheKeysDeleted: allKeys.length
          });
        }
      }
    } catch (error: any) {
      logger.warn('Failed to invalidate analytics cache', {
        error: error.message,
        tenantId
      });
    }
  }

  async updateOrder(id: string, data: any, tenantId: string): Promise<Order> {
    const order = await this.getOrderById(id, tenantId);
    if (!order) {
      throw new Error('Order not found');
    }

    // If updating items, handle stock changes and recalculate totals
    if (data.items && Array.isArray(data.items)) {
      return prisma.$transaction(async (tx) => {
        // Get current order with items
        const currentOrder = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!currentOrder) {
          throw new Error('Order not found');
        }

        // Restore stock for removed items
        const currentItemIds = new Set(currentOrder.items.map(item => item.productId));
        const newItemIds = new Set(data.items.map((item: any) => item.productId));
        
        // Items to remove (in current but not in new)
        const itemsToRemove = currentOrder.items.filter(item => !newItemIds.has(item.productId));
        for (const item of itemsToRemove) {
          await productService.updateStock(item.productId, item.quantity, tenantId, 'add');
        }

        // Update quantities for existing items
        for (const currentItem of currentOrder.items) {
          const newItem = data.items.find((item: any) => item.productId === currentItem.productId);
          if (newItem) {
            const quantityDiff = newItem.quantity - currentItem.quantity;
            if (quantityDiff !== 0) {
              // Adjust stock based on quantity difference
              if (quantityDiff > 0) {
                // Quantity increased, subtract stock
                await productService.updateStock(currentItem.productId, quantityDiff, tenantId, 'subtract');
              } else {
                // Quantity decreased, add stock back
                await productService.updateStock(currentItem.productId, Math.abs(quantityDiff), tenantId, 'add');
              }
            }
          }
        }

        // Add stock for new items
        const itemsToAdd = data.items.filter((item: any) => !currentItemIds.has(item.productId));
        for (const item of itemsToAdd) {
          await productService.updateStock(item.productId, item.quantity, tenantId, 'subtract');
        }

        // Delete all existing items
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // Create new items with cost and profit
        const newItems = await Promise.all(
          data.items.map(async (item: any) => {
            // Get product to retrieve cost
            const product = await productService.getProductById(item.productId, tenantId);
            if (!product) {
              throw new Error(`Product ${item.productId} not found`);
            }

            // Get cost from product (if available)
            const cost = product.cost ? Number(product.cost) : null;
            
            // Calculate profit = (price - cost) * quantity (only if cost exists)
            const profit = cost !== null ? (item.price - cost) * item.quantity : null;

            return {
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price.toString(),
              cost: cost !== null ? cost.toString() : null,
              subtotal: (item.price * item.quantity).toString(),
              profit: profit !== null ? profit.toString() : null,
            };
          })
        );

        await tx.orderItem.createMany({
          data: newItems,
        });

        // Update order totals
        const updateData: any = {};
        if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
        if (data.total !== undefined) updateData.total = data.total;
        if (data.discount !== undefined) updateData.discount = data.discount.toString();
        if (data.sendToKitchen !== undefined) {
          updateData.sendToKitchen = data.sendToKitchen;
          updateData.kitchenStatus = data.sendToKitchen ? 'PENDING' : null;
        }
        if (data.temporaryCustomerName !== undefined) updateData.temporaryCustomerName = data.temporaryCustomerName;
        if (data.notes !== undefined) updateData.notes = data.notes;

        // Emit stock updates via socket
        const { emitToTenant } = await import('../socket/socket');
        for (const item of data.items) {
          const product = await productService.getProductById(item.productId, tenantId);
          if (product) {
            emitToTenant(tenantId, 'product:stock-update', {
              productId: item.productId,
              stock: product.stock,
            });
          }
        }

        return tx.order.update({
          where: { id },
          data: updateData,
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: true,
            member: true,
            outlet: true,
          },
        });
      });
    }

    // Simple update without items
    const updateData: any = {};
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.discount !== undefined) updateData.discount = data.discount.toString();
    if (data.sendToKitchen !== undefined) {
      updateData.sendToKitchen = data.sendToKitchen;
      updateData.kitchenStatus = data.sendToKitchen ? 'PENDING' : null;
    }
    if (data.temporaryCustomerName !== undefined) updateData.temporaryCustomerName = data.temporaryCustomerName;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        member: true,
        outlet: true,
      },
    });

    // Invalidate analytics cache after order update
    await this.invalidateAnalyticsCache(tenantId);

    return updatedOrder;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusInput, tenantId: string): Promise<Order> {
    const order = await this.getOrderById(id, tenantId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get order with items
    const orderWithItems = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    // If cancelling or refunding, restore product stock
    if ((data.status === 'CANCELLED' || data.status === 'REFUNDED') && order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      if (orderWithItems?.items) {
        for (const item of orderWithItems.items) {
          const updatedProduct = await productService.updateStock(item.productId, item.quantity, tenantId, 'add');
          
          // Emit stock update via socket
          const { emitToTenant } = await import('../socket/socket');
          emitToTenant(tenantId, 'product:stock-update', {
            productId: item.productId,
            stock: updatedProduct.stock,
          });
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: data.status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Invalidate analytics cache after order status update
    await this.invalidateAnalyticsCache(tenantId);

    return updatedOrder;
  }

  /**
   * Delete single order
   * Only allow deletion of CANCELLED or REFUNDED orders
   */
  async deleteOrder(orderId: string, tenantId: string): Promise<void> {
    const order = await this.getOrderById(orderId, tenantId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow deletion of CANCELLED or REFUNDED orders
    if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      throw new Error(`Order ${order.orderNumber} cannot be deleted. Status must be CANCELLED or REFUNDED.`);
    }

    // Delete transaction first (if exists)
    // This is a safety measure in case onDelete: Cascade hasn't been applied yet
    try {
      await prisma.transaction.deleteMany({
        where: { orderId },
      });
    } catch (error: any) {
      // If transaction doesn't exist or already deleted, continue
      console.warn('Transaction deletion warning (may not exist):', error.message);
    }

    // Delete order items first
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // Delete order (transaction will be cascade deleted if onDelete: Cascade is set)
    await prisma.order.delete({
      where: { id: orderId },
    });

    // Invalidate analytics cache after order deletion
    await this.invalidateAnalyticsCache(tenantId);
  }

  /**
   * Bulk delete orders
   * Only allow deletion of CANCELLED or REFUNDED orders
   */
  async bulkDeleteOrders(tenantId: string, orderIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        const order = await this.getOrderById(orderId, tenantId);
        if (!order) {
          failed++;
          errors.push(`Order ${orderId} not found`);
          continue;
        }

        // Only allow deletion of CANCELLED or REFUNDED orders
        if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
          failed++;
          errors.push(`Order ${order.orderNumber} cannot be deleted. Status must be CANCELLED or REFUNDED.`);
          continue;
        }

        // Delete transaction first (if exists)
        // This is a safety measure in case onDelete: Cascade hasn't been applied yet
        try {
          await prisma.transaction.deleteMany({
            where: { orderId },
          });
        } catch (error: any) {
          // If transaction doesn't exist or already deleted, continue
          console.warn(`Transaction deletion warning for order ${orderId} (may not exist):`, error.message);
        }

        // Delete order items first
        await prisma.orderItem.deleteMany({
          where: { orderId },
        });

        // Delete order (transaction will be cascade deleted if onDelete: Cascade is set)
        await prisma.order.delete({
          where: { id: orderId },
        });

        deleted++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to delete order ${orderId}: ${error.message}`);
      }
    }

    return { deleted, failed, errors };
  }

  /**
   * Bulk refund orders
   * Only allow refund of COMPLETED orders
   */
  async bulkRefundOrders(tenantId: string, orderIds: string[]): Promise<{ refunded: number; failed: number; errors: string[] }> {
    let refunded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        const order = await this.getOrderById(orderId, tenantId);
        if (!order) {
          failed++;
          errors.push(`Order ${orderId} not found`);
          continue;
        }

        // Only allow refund of COMPLETED orders
        if (order.status !== 'COMPLETED') {
          failed++;
          errors.push(`Order ${order.orderNumber} cannot be refunded. Status must be COMPLETED.`);
          continue;
        }

        // Refund order (update status to REFUNDED and restore stock)
        await this.updateOrderStatus(orderId, { status: 'REFUNDED' }, tenantId);
        refunded++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to refund order ${orderId}: ${error.message}`);
      }
    }

    return { refunded, failed, errors };
  }

  async getOrderStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [totalOrders, totalRevenue, completedOrders, pendingOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.order.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      completedOrders,
      pendingOrders,
      averageOrderValue: completedOrders > 0 ? Number(totalRevenue._sum.total || 0) / completedOrders : 0,
    };
  }

  /**
   * Bulk update kitchen status for multiple orders
   */
  async bulkUpdateKitchenStatus(tenantId: string, orderIds: string[], status: 'PENDING' | 'COOKING' | 'READY' | 'SERVED') {
    // Verify all orders belong to tenant and are sent to kitchen
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        tenantId,
        sendToKitchen: true, // Only update orders sent to kitchen
      },
    });

    if (orders.length !== orderIds.length) {
      throw new Error('Some orders not found or not sent to kitchen');
    }

    // Bulk update
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        tenantId,
        sendToKitchen: true,
      },
      data: {
        kitchenStatus: status,
      },
    });

    // Emit socket events for real-time updates
    const { emitToTenant } = await import('../socket/socket');
    orderIds.forEach(orderId => {
      emitToTenant(tenantId, 'order:update', {
        orderId,
        kitchenStatus: status,
      });
    });

    return {
      updated: result.count,
      orderIds,
      status,
    };
  }
}

export default new OrderService();

