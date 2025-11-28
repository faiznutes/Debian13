/**
 * Audit Middleware
 * Automatically logs API requests and data changes
 */

import { Request, Response, NextFunction } from 'express';
import advancedAuditService from '../services/advanced-audit.service';
import { getTenantId } from '../utils/tenant';

/**
 * Middleware to log API requests
 */
export const auditMiddleware = (action: string, resource: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const user = (req as any).user;

      if (tenantId) {
        await advancedAuditService.logEvent(tenantId, {
          userId: user?.id,
          action,
          resource,
          resourceId: req.params.id,
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
          },
          severity,
        });
      }
    } catch (error) {
      // Don't break the request if audit logging fails
      console.error('Audit middleware error:', error);
    }
    next();
  };
};

/**
 * Middleware to log data changes (for PUT/PATCH/DELETE)
 */
export const auditDataChangeMiddleware = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);
    let responseBody: any;

    res.send = function (body: any) {
      responseBody = body;
      return originalSend(body);
    };

    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const tenantId = getTenantId(req);
          const user = (req as any).user;

          if (tenantId && user) {
            const action = req.method === 'DELETE' ? 'DELETE' : req.method === 'POST' ? 'CREATE' : 'UPDATE';
            
            // Try to get before/after data
            const before = (req as any).auditBefore;
            const after = responseBody && typeof responseBody === 'object' ? responseBody : undefined;

            await advancedAuditService.logDataChange(tenantId, {
              userId: user.id,
              action,
              resource,
              resourceId: req.params.id || (responseBody?.id || responseBody?.data?.id),
              before,
              after,
              ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
              userAgent: req.headers['user-agent'],
            });
          }
        }
      } catch (error) {
        console.error('Audit data change middleware error:', error);
      }
    });

    next();
  };
};

