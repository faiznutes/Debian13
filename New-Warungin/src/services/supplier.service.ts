/**
 * Supplier Service
 * Manages suppliers for inventory management
 */

import prisma from '../config/database';
import logger from '../utils/logger';

interface CreateSupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}

interface UpdateSupplierInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive?: boolean;
}

class SupplierService {
  /**
   * Get all suppliers for tenant
   */
  async getSuppliers(tenantId: string, query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ];
      }
      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supplier.count({ where }),
      ]);

      return {
        data: suppliers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting suppliers:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string, tenantId: string) {
    try {
      const supplier = await prisma.supplier.findFirst({
        where: { id, tenantId },
        include: {
          purchaseOrders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      return supplier;
    } catch (error: any) {
      logger.error('Error getting supplier:', error);
      throw error;
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(tenantId: string, data: CreateSupplierInput) {
    try {
      return await prisma.supplier.create({
        data: {
          tenantId,
          ...data,
        },
      });
    } catch (error: any) {
      logger.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, tenantId: string, data: UpdateSupplierInput) {
    try {
      const supplier = await this.getSupplierById(id, tenantId);

      return await prisma.supplier.update({
        where: { id: supplier.id },
        data,
      });
    } catch (error: any) {
      logger.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string, tenantId: string) {
    try {
      const supplier = await this.getSupplierById(id, tenantId);

      // Check if supplier has purchase orders
      const purchaseOrderCount = await prisma.purchaseOrder.count({
        where: { supplierId: supplier.id },
      });

      if (purchaseOrderCount > 0) {
        throw new Error('Cannot delete supplier with existing purchase orders');
      }

      await prisma.supplier.delete({
        where: { id: supplier.id },
      });
    } catch (error: any) {
      logger.error('Error deleting supplier:', error);
      throw error;
    }
  }
}

export default new SupplierService();

