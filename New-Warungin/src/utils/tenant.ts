import { Request } from 'express';

/**
 * Get tenantId from request
 * For SUPER_ADMIN: uses tenantId from query parameter
 * For other roles: uses tenantId from user object
 */
export const getTenantId = (req: Request): string | null => {
  const user = (req as any).user;
  const role = user?.role;
  
  // SUPER_ADMIN can specify tenantId via query parameter
  if (role === 'SUPER_ADMIN') {
    const queryTenantId = req.query.tenantId as string;
    if (queryTenantId) {
      return queryTenantId;
    }
    // If no tenantId in query, return null (will cause error)
    return null;
  }
  
  // For other roles, use tenantId from user
  // Check both req.user.tenantId and req.tenantId (from auth middleware)
  const tenantId = user?.tenantId || (req as any).tenantId;
  
  if (!tenantId) {
    console.error('Tenant ID not found in request:', {
      role,
      hasUser: !!user,
      userTenantId: user?.tenantId,
      reqTenantId: (req as any).tenantId,
      userId: user?.id,
    });
  }
  
  return tenantId || null;
};

/**
 * Get userId from request
 */
export const requireUserId = (req: Request): string => {
  const user = (req as any).user;
  if (!user || !user.id) {
    throw new Error('User ID is required. Please authenticate first.');
  }
  return user.id;
};

/**
 * Validate that tenantId exists (required for all roles except SUPER_ADMIN without selected tenant)
 */
export const requireTenantId = (req: Request): string => {
  const user = (req as any).user;
  const role = user?.role;
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    // For SUPER_ADMIN, provide more helpful message
    if (role === 'SUPER_ADMIN') {
      throw new Error('Tenant ID is required. Please select a tenant first.');
    }
    // For other roles, this should not happen (tenantId should be in token)
    throw new Error('Tenant ID is required. Please contact administrator if this error persists.');
  }
  
  return tenantId;
};

