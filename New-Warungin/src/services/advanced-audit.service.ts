/**
 * Advanced Audit Logging Service
 * Comprehensive audit trail for user actions, data changes, and system events
 */

import prisma from '../config/database';
import logger from '../utils/logger';

interface AuditEvent {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}

interface AuditQuery {
  tenantId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class AdvancedAuditService {
  /**
   * Log audit event
   */
  async logEvent(
    tenantId: string,
    data: {
      userId?: string;
      action: string;
      resource: string;
      resourceId?: string;
      changes?: {
        before?: any;
        after?: any;
        fields?: string[];
      };
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }
  ): Promise<void> {
    try {
      const event: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        severity: data.severity || 'MEDIUM',
        timestamp: new Date(),
      };

      // Save to database
      await prisma.auditLog.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          changes: event.changes ? JSON.stringify(event.changes) : null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          severity: event.severity,
        },
      });

      // Also log to application logger for critical events
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        logger.warn('Critical audit event:', {
          action: event.action,
          resource: event.resource,
          userId: event.userId,
          tenantId: event.tenantId,
        });
      }
    } catch (error: any) {
      logger.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log data change (create, update, delete)
   */
  async logDataChange(
    tenantId: string,
    data: {
      userId: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      resource: string;
      resourceId: string;
      before?: any;
      after?: any;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const fields = data.before && data.after
      ? this.getChangedFields(data.before, data.after)
      : undefined;

    await this.logEvent(tenantId, {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      changes: {
        before: data.before,
        after: data.after,
        fields,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.action === 'DELETE' ? 'HIGH' : 'MEDIUM',
    });
  }

  /**
   * Get changed fields between two objects
   */
  private getChangedFields(before: any, after: any): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

    for (const key of allKeys) {
      if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    tenantId: string,
    data: {
      userId: string;
      action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | '2FA_ENABLED' | '2FA_DISABLED';
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const severity = data.action === 'LOGIN_FAILED' ? 'MEDIUM' : 'LOW';
    
    await this.logEvent(tenantId, {
      userId: data.userId,
      action: data.action,
      resource: 'AUTH',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
      severity,
    });
  }

  /**
   * Log permission/access event
   */
  async logAccessEvent(
    tenantId: string,
    data: {
      userId: string;
      action: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PERMISSION_CHANGED';
      resource: string;
      resourceId?: string;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const severity = data.action === 'ACCESS_DENIED' ? 'HIGH' : 'MEDIUM';
    
    await this.logEvent(tenantId, {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: {
        reason: data.reason,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity,
    });
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(query: AuditQuery) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (query.tenantId) where.tenantId = query.tenantId;
      if (query.userId) where.userId = query.userId;
      if (query.action) where.action = query.action;
      if (query.resource) where.resource = query.resource;
      if (query.severity) where.severity = query.severity;
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = query.startDate;
        if (query.endDate) where.createdAt.lte = query.endDate;
      }

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
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data: logs.map(log => ({
          ...log,
          changes: log.changes ? JSON.parse(log.changes) : null,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(tenantId: string, dateRange?: { startDate: Date; endDate: Date }) {
    try {
      const where: any = { tenantId };
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        };
      }

      const [totalEvents, byAction, bySeverity, byUser] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
        }),
        prisma.auditLog.groupBy({
          by: ['severity'],
          where,
          _count: { severity: true },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: { userId: true },
        }),
      ]);

      return {
        totalEvents,
        byAction: byAction.reduce((acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {} as Record<string, number>),
        byUser: byUser.reduce((acc, item) => {
          acc[item.userId || 'SYSTEM'] = item._count.userId;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error: any) {
      logger.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(tenantId: string, query: AuditQuery, format: 'CSV' | 'JSON' = 'CSV'): Promise<string> {
    try {
      const logs = await this.queryAuditLogs({ ...query, tenantId, limit: 10000 });

      if (format === 'CSV') {
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'Severity', 'IP Address'];
        const rows = logs.data.map(log => [
          log.createdAt.toISOString(),
          log.user?.name || 'SYSTEM',
          log.action,
          log.resource,
          log.resourceId || '',
          log.severity,
          log.ipAddress || '',
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
      } else {
        return JSON.stringify(logs.data, null, 2);
      }
    } catch (error: any) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

export default new AdvancedAuditService();

