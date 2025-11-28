import { Request, Response, NextFunction } from 'express';
import addonService from '../services/addon.service';
import { requireTenantId } from '../utils/tenant';

/**
 * Middleware to check if tenant has specific addon active
 * Super Admin and Admin Tenant bypass addon check for basic features
 */
export const checkAddon = (addonType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user?.role;
      
      // Super Admin bypass addon check
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }
      
      // Admin Tenant bypass addon check for basic analytics (predictions, top-products)
      // This allows admin tenant to access basic reports without addon
      if (userRole === 'ADMIN_TENANT' && (addonType === 'BUSINESS_ANALYTICS')) {
        // Allow basic analytics access for admin tenant
        return next();
      }
      
      const tenantId = requireTenantId(req);
      const addons = await addonService.getTenantAddons(tenantId);
      
      const hasAddon = addons.some(
        (addon) => addon.addonType === addonType && addon.status === 'active'
      );
      
      if (!hasAddon) {
        const addonNames: Record<string, string> = {
          'BUSINESS_ANALYTICS': 'Business Analytics & Insight',
          'EXPORT_REPORTS': 'Export Laporan',
          'RECEIPT_EDITOR': 'Simple Nota Editor',
        };
        
        const addonName = addonNames[addonType] || addonType;
        return res.status(403).json({ 
          message: `${addonName} addon is required to access this feature` 
        });
      }
      
      next();
    } catch (error: any) {
      next(error);
    }
  };
};

/**
 * Middleware specifically for Business Analytics addon
 */
export const checkBusinessAnalyticsAddon = checkAddon('BUSINESS_ANALYTICS');

/**
 * Middleware specifically for Export Reports addon
 */
export const checkExportReportsAddon = checkAddon('EXPORT_REPORTS');

/**
 * Middleware specifically for Receipt Editor addon
 */
export const checkReceiptEditorAddon = checkAddon('RECEIPT_EDITOR');

