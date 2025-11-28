import prisma from '../config/database';
import { Request } from 'express';

export interface AuditLogData {
  tenantId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILED' | 'ERROR';
  errorMessage?: string | null;
}

export class AuditLogService {
  /**
   * Create audit log entry
   */
  async createLog(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId || null,
          userId: data.userId || null,
          userEmail: data.userEmail || null,
          userName: data.userName || null,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId || null,
          details: data.details || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          status: data.status || 'SUCCESS',
          errorMessage: data.errorMessage || null,
        },
      });
    } catch (error: any) {
      // Don't throw error - audit logging should not break the application
      console.error('Failed to create audit log:', error.message);
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(query: {
    tenantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query.tenantId && { tenantId: query.tenantId }),
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...(query.resource && { resource: query.resource }),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate && { gte: query.startDate }),
              ...(query.endDate && { lte: query.endDate }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async getLogById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.auditLog.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Extract request info for audit log
   */
  extractRequestInfo(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
  } {
    return {
      ipAddress: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
  }
}

/**
 * Static helper to extract request info
 */
export function extractRequestInfo(req: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

export default new AuditLogService();

