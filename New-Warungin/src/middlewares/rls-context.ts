import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to set RLS context for Prisma queries
 * This attaches tenantId to Prisma params so the Prisma middleware can set session variables
 * 
 * IMPORTANT: This middleware should be applied after authGuard to ensure
 * tenantId is available in the request
 * 
 * Note: RLS is an additional security layer. Application-level checks are primary.
 */
export const setRLSContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Attach tenantId to request for Prisma middleware to use
  // SUPER_ADMIN bypasses RLS (no tenantId set)
  if (req.tenantId && req.role !== 'SUPER_ADMIN') {
    // Store tenantId in request for Prisma middleware
    (req as any).__rlsTenantId = req.tenantId;
  }
  
  next();
};

/**
 * Helper to get RLS tenant ID from request
 * Used by Prisma middleware to set session variables
 */
export function getRLSTenantId(req: any): string | null {
  return req.__rlsTenantId || null;
}

