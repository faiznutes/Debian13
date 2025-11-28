import { Request, Response, NextFunction } from 'express';
import auditLogService, { extractRequestInfo } from '../services/audit-log.service';
import { AuthRequest } from './auth';

/**
 * Audit logging middleware
 * Logs all requests to critical endpoints
 */
export const auditLogger = (
  action: string,
  resource: string,
  getResourceId?: (req: Request) => string | null,
  getDetails?: (req: Request, res: Response) => any
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          const tenantId = req.tenantId || null;
          const userId = req.userId || null;
          // Get user info from request if available, otherwise null
          const userEmail = (req as any).user?.email || null;
          const userName = (req as any).user?.name || null;
          const resourceId = getResourceId ? getResourceId(req) : null;
          const details = getDetails ? getDetails(req, res) : null;
          const requestInfo = extractRequestInfo(req);

          // Determine status
          let status: 'SUCCESS' | 'FAILED' | 'ERROR' = 'SUCCESS';
          let errorMessage: string | null = null;

          if (res.statusCode >= 500) {
            status = 'ERROR';
            errorMessage = body?.message || body?.error || 'Internal server error';
          } else if (res.statusCode >= 400) {
            status = 'FAILED';
            errorMessage = body?.message || body?.error || 'Request failed';
          }

          await auditLogService.createLog({
            tenantId,
            userId,
            userEmail,
            userName,
            action,
            resource,
            resourceId,
            details: details || {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              ...(body && typeof body === 'object' ? { response: body } : {}),
            },
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent,
            status,
            errorMessage,
          });
        } catch (error: any) {
          // Don't log audit errors - silent fail
          console.error('Audit logging error:', error.message);
        }
      });

      return originalJson(body);
    };

    // Override res.status to track status code
    res.status = function (code: number) {
      return originalStatus(code);
    };

    next();
  };
};

/**
 * Simple audit logger for specific actions
 */
export const logAction = async (
  req: AuthRequest,
  action: string,
  resource: string,
  resourceId?: string | null,
  details?: any,
  status: 'SUCCESS' | 'FAILED' | 'ERROR' = 'SUCCESS',
  errorMessage?: string | null
) => {
  try {
    const tenantId = req.tenantId || null;
    const userId = req.userId || null;
    // Get user info from request if available, otherwise null
    const userEmail = (req as any).user?.email || null;
    const userName = (req as any).user?.name || null;
    const requestInfo = extractRequestInfo(req);

    await auditLogService.createLog({
      tenantId,
      userId,
      userEmail,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      status,
      errorMessage,
    });
  } catch (error: any) {
    // Silent fail - don't break application
    console.error('Failed to log action:', error.message);
  }
};

