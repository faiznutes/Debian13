import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import prisma from '../config/database';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string | null;
  role?: string;
}

/**
 * Enhanced error logging helper
 */
function logAuthError(error: unknown, context: string, req: any) {
  const err = error as Error & { code?: string; message?: string; stack?: string };
  logger.error(`Auth middleware error [${context}]:`, {
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
    path: req.path || req.url,
    method: req.method,
    headers: {
      authorization: req.headers?.authorization ? 'Bearer ***' : 'missing',
      origin: req.headers?.origin,
    },
  });
}

/**
 * Set CORS headers helper
 */
function setCorsHeaders(res: Response, req: any) {
  const origin = req.headers?.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export const authGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      setCorsHeaders(res, req);
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    let decoded: { userId: string; tenantId: string; role: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        tenantId: string;
        role: string;
      };
    } catch (jwtError) {
      const err = jwtError as Error & { name?: string };
      logAuthError(jwtError, 'JWT_VERIFICATION', req);
      
      setCorsHeaders(res, req);
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Unauthorized: Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
      } else {
        res.status(401).json({ error: 'Unauthorized: Token verification failed' });
      }
      return;
    }

    // Validate user exists and is active
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });
    } catch (dbError: unknown) {
      const err = dbError as Error & { code?: string; message?: string };
      logAuthError(dbError, 'DATABASE_QUERY', req);
      
      setCorsHeaders(res, req);
      // Check if it's a connection error
      if (err.code === 'P1001' || err.code === 'P1002' || err.message?.includes('connect')) {
        res.status(503).json({ 
          error: 'Database connection failed. Please try again.',
          message: 'Unable to connect to database. Please retry the request.',
        });
      } else {
        res.status(500).json({ 
          error: 'Database error occurred',
          message: 'An error occurred while verifying your credentials.',
        });
      }
      return;
    }

    if (!user) {
      logAuthError(new Error('User not found'), 'USER_NOT_FOUND', req);
      setCorsHeaders(res, req);
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    if (!user.isActive) {
      logAuthError(new Error('User inactive'), 'USER_INACTIVE', req);
      setCorsHeaders(res, req);
      res.status(401).json({ error: 'Unauthorized: User account is inactive' });
      return;
    }

    // Validate tenant exists and is active (skip for SUPER_ADMIN)
    if (decoded.role !== 'SUPER_ADMIN') {
      if (!user.tenant) {
        logAuthError(new Error('Tenant not found for non-super-admin'), 'TENANT_NOT_FOUND', req);
        setCorsHeaders(res, req);
        res.status(403).json({ error: 'Forbidden: Tenant not found' });
        return;
      }
      
      if (!user.tenant.isActive) {
        logAuthError(new Error('Tenant inactive'), 'TENANT_INACTIVE', req);
        setCorsHeaders(res, req);
        res.status(403).json({ error: 'Forbidden: Tenant is inactive' });
        return;
      }
    } else {
      // Super Admin can have inactive tenant, just ensure tenant exists
      if (!user.tenant) {
        logAuthError(new Error('Tenant not found for super admin'), 'TENANT_NOT_FOUND', req);
        setCorsHeaders(res, req);
        res.status(403).json({ error: 'Forbidden: Tenant not found' });
        return;
      }
    }

    // Check store assignment for CASHIER, KITCHEN, and SUPERVISOR roles
    if (decoded.role === 'CASHIER' || decoded.role === 'KITCHEN' || decoded.role === 'SUPERVISOR') {
      interface UserPermissions {
        assignedStoreId?: string;
        allowedStoreIds?: string[];
      }
      const permissions = (user.permissions as UserPermissions) || {};
      
      if (decoded.role === 'CASHIER' || decoded.role === 'KITCHEN') {
        const assignedStoreId = permissions?.assignedStoreId;
        
        if (assignedStoreId) {
          try {
            const assignedStore = await prisma.outlet.findFirst({
              where: {
                id: assignedStoreId,
                tenantId: user.tenantId || user.tenant?.id || '',
              },
            });
            
            if (!assignedStore || !assignedStore.isActive) {
              setCorsHeaders(res, req);
              res.status(403).json({ 
                error: `Store "${assignedStore?.name || 'yang ditetapkan'}" yang ditetapkan untuk akun Anda saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
                message: `Store "${assignedStore?.name || 'yang ditetapkan'}" yang ditetapkan untuk akun Anda saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
              });
              return;
            }
          } catch (storeError) {
            logAuthError(storeError, 'STORE_QUERY', req);
            setCorsHeaders(res, req);
            res.status(500).json({ error: 'Error checking store assignment' });
            return;
          }
        }
      } else if (decoded.role === 'SUPERVISOR') {
        const allowedStoreIds = permissions?.allowedStoreIds || [];
        
        if (allowedStoreIds.length > 0) {
          try {
            const allowedStores = await prisma.outlet.findMany({
              where: {
                id: { in: allowedStoreIds },
                tenantId: user.tenantId || user.tenant?.id || '',
              },
            });
            
            const activeStores = allowedStores.filter(store => store.isActive);
            
            if (activeStores.length === 0) {
              const storeNames = allowedStores.map(s => s.name).join(', ');
              setCorsHeaders(res, req);
              res.status(403).json({ 
                error: `Semua store yang diizinkan untuk akun Anda (${storeNames}) saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
                message: `Semua store yang diizinkan untuk akun Anda (${storeNames}) saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
              });
              return;
            }
          } catch (storeError) {
            logAuthError(storeError, 'STORE_QUERY', req);
            setCorsHeaders(res, req);
            res.status(500).json({ error: 'Error checking store assignment' });
            return;
          }
        }
      }
    }

    // Ensure tenantId is set (use from decoded token or fallback to user.tenantId)
    let tenantId: string | null = decoded.tenantId || user.tenantId || null;
    
    // If tenantId is empty string, convert to null for Super Admin
    if (tenantId === '' && decoded.role === 'SUPER_ADMIN') {
      tenantId = null;
    }
    
    if (!tenantId && decoded.role !== 'SUPER_ADMIN') {
      logAuthError(new Error('Tenant ID missing for non-Super Admin'), 'TENANT_ID_MISSING', req);
      setCorsHeaders(res, req);
      res.status(403).json({ error: 'Forbidden: Tenant ID not found' });
      return;
    }
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.tenantId = tenantId;
    req.role = decoded.role;
    
    // Also attach to req.user for compatibility with routes
    interface ExtendedRequest extends Request {
      user?: {
        id: string;
        tenantId: string | null;
        role: string;
        email: string;
        name: string;
      };
    }
    (req as ExtendedRequest).user = {
      id: decoded.userId,
      tenantId: tenantId,
      role: decoded.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error: unknown) {
    // Catch any unexpected errors
    logAuthError(error, 'UNEXPECTED_ERROR', req);
    setCorsHeaders(res, req);
    
    // Ensure response hasn't been sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication.',
      });
    }
  }
};

export const roleGuard = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role) {
      logger.warn('Role guard: No role found', {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({ error: 'Unauthorized: No role found' });
      return;
    }

    if (!allowedRoles.includes(req.role)) {
      logger.warn('Role guard: Insufficient permissions', {
        path: req.path,
        method: req.method,
        userRole: req.role,
        requiredRoles: allowedRoles,
      });
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};
