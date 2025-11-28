import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { requireTenantId } from '../utils/tenant';
import quickInsightService from '../services/quick-insight.service';
import addonService from '../services/addon.service';

const router = Router();

// Middleware to check Business Analytics addon (Super Admin bypass)
const checkBusinessAnalyticsAddon = async (req: Request, res: Response, next: Function) => {
  try {
    const userRole = (req as any).user?.role;
    
    // Super Admin bypass addon check
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }
    
    const tenantId = requireTenantId(req);
    const addons = await addonService.getTenantAddons(tenantId);
    const hasBusinessAnalytics = addons.some(
      (addon) => addon.addonType === 'BUSINESS_ANALYTICS' && addon.status === 'active'
    );
    
    if (!hasBusinessAnalytics) {
      return res.status(403).json({ 
        message: 'Business Analytics & Insight addon is required to access this feature' 
      });
    }
    
    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

router.get(
  '/',
  authGuard,
  checkBusinessAnalyticsAddon,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      const period = (req.query.period as string) || (userRole === 'SUPER_ADMIN' ? 'monthly' : 'daily');
      
      // For Super Admin, use global stats (all tenants)
      if (userRole === 'SUPER_ADMIN') {
        const insight = await quickInsightService.getGlobalQuickInsight(period as 'daily' | 'weekly' | 'monthly');
        return res.json(insight);
      }
      
      const tenantId = requireTenantId(req);
      const insight = await quickInsightService.getQuickInsight(tenantId, period as 'daily' | 'weekly' | 'monthly');
      res.json(insight);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


