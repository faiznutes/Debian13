import { PrismaClient, Employee } from '@prisma/client';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  position: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  isActive?: boolean;
}

export class EmployeeService {
  async getEmployees(tenantId: string, page: number = 1, limit: number = 10, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeById(id: string, tenantId: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: { id, tenantId },
    });
  }

  async getEmployeeByEmail(email: string, tenantId: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: { email, tenantId },
    });
  }

  async createEmployee(data: CreateEmployeeInput, tenantId: string): Promise<Employee> {
    // Check if email already exists for this tenant
    const existing = await prisma.employee.findFirst({
      where: { email: data.email, tenantId },
    });

    if (existing) {
      throw new Error('Employee with this email already exists');
    }

    const employee = await prisma.employee.create({
      data: {
        ...data,
        tenantId,
      },
    });

    logger.info(`Employee created: ${employee.id} for tenant: ${tenantId}`);

    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput, tenantId: string): Promise<Employee> {
    const employee = await this.getEmployeeById(id, tenantId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== employee.email) {
      const existing = await this.getEmployeeByEmail(data.email, tenantId);
      if (existing && existing.id !== id) {
        throw new Error('Employee with this email already exists');
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data,
    });

    logger.info(`Employee updated: ${updatedEmployee.id} for tenant: ${tenantId}`);

    return updatedEmployee;
  }

  async deleteEmployee(id: string, tenantId: string): Promise<void> {
    const employee = await this.getEmployeeById(id, tenantId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    await prisma.employee.delete({
      where: { id },
    });

    logger.info(`Employee deleted: ${id} for tenant: ${tenantId}`);
  }

  /**
   * Get employee statistics for a tenant
   */
  async getEmployeeStats(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId, isActive: true } }),
      prisma.employee.count({ where: { tenantId, isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}

export default new EmployeeService();

