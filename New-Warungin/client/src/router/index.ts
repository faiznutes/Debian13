import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MarketingLayout from '../layouts/MarketingLayout.vue';

// Helper function to get layout based on role
const getLayoutForRole = (role: string | undefined) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return () => import('../layouts/SuperAdminLayout.vue');
    case 'ADMIN_TENANT':
      return () => import('../layouts/TenantLayout.vue');
    case 'CASHIER':
      return () => import('../layouts/KasirLayout.vue');
    case 'KITCHEN':
      return () => import('../layouts/KitchenLayout.vue');
    default:
      return () => import('../layouts/AppLayout.vue');
  }
};

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  },
  routes: [
    {
      path: '/',
      component: MarketingLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/marketing/Home.vue'),
        },
        {
          path: 'demo',
          name: 'demo',
          component: () => import('../views/marketing/Demo.vue'),
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('../views/marketing/Contact.vue'),
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('../views/marketing/Terms.vue'),
        },
        {
          path: 'pricing',
          name: 'pricing',
          component: () => import('../views/marketing/Pricing.vue'),
        },
        {
          path: 'help',
          name: 'help',
          component: () => import('../views/marketing/Help.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
    },
    // Payment callback routes (public, no auth required)
    {
      path: '/payment/success',
      name: 'payment-success',
      component: () => import('../views/payment/PaymentCallback.vue'),
      props: (route) => ({ status: 'success', ...route.query }),
    },
    {
      path: '/payment/error',
      name: 'payment-error',
      component: () => import('../views/payment/PaymentCallback.vue'),
      props: (route) => ({ status: 'error', ...route.query }),
    },
    {
      path: '/payment/pending',
      name: 'payment-pending',
      component: () => import('../views/payment/PaymentCallback.vue'),
      props: (route) => ({ status: 'pending', ...route.query }),
    },
    // App Routes - Dynamic Layout based on role
    {
      path: '/app',
      component: () => import('../layouts/DynamicLayout.vue'),
      redirect: '/app/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/dashboard/Dashboard.vue'),
          meta: { roles: ['SUPER_ADMIN', 'ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN'] },
        },
        // Super Admin only
        {
          path: 'tenants',
          name: 'tenants',
          component: () => import('../views/tenants/Tenants.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'tenants/:id',
          name: 'tenant-detail',
          component: () => import('../views/tenants/TenantDetail.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'tenants/support',
          name: 'tenant-support',
          component: () => import('../views/tenants/TenantSupport.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'reports/global',
          name: 'global-reports',
          component: () => import('../views/reports/GlobalReports.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'settings/system',
          name: 'system-settings',
          component: () => import('../views/settings/SystemSettings.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        // Tenant & Super Admin
        {
          path: 'products',
          name: 'products',
          component: () => import('../views/products/Products.vue'),
          meta: { 
            roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'SUPER_ADMIN'],
            requiresPermission: { role: 'CASHIER', permission: 'canManageProducts' }
          },
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/orders/Orders.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN', 'SUPER_ADMIN'] },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('../views/customers/Customers.vue'),
          meta: { 
            roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'SUPER_ADMIN'],
            requiresPermission: { role: 'CASHIER', permission: 'canManageCustomers' }
          },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../views/reports/Reports.vue'),
          meta: { 
            roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'SUPER_ADMIN'],
            requiresPermission: { role: 'CASHIER', permission: 'canViewReports' }
          },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/users/Users.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        {
          path: 'subscription',
          name: 'subscription',
          component: () => import('../views/subscription/Subscription.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'addons',
          name: 'addons',
          component: () => import('../views/addons/Addons.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'rewards',
          name: 'rewards',
          component: () => import('../views/rewards/Rewards.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        {
          path: 'reward-view',
          name: 'reward-view',
          component: () => import('../views/rewards/RewardView.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        {
          path: 'discounts',
          name: 'discounts',
          component: () => import('../views/discounts/Discounts.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        // Addon Features
        {
          path: 'delivery',
          name: 'delivery',
          component: () => import('../views/delivery/DeliveryOrders.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        {
          path: 'marketing',
          name: 'marketing',
          component: () => import('../views/marketing/MarketingCampaigns.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        {
          path: 'marketing/email-templates',
          name: 'email-templates',
          component: () => import('../views/marketing/EmailTemplates.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        {
          path: 'marketing/email-analytics',
          name: 'email-analytics',
          component: () => import('../views/marketing/EmailAnalytics.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        {
          path: 'marketing/email-scheduler',
          name: 'email-scheduler',
          component: () => import('../views/marketing/EmailScheduler.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        {
          path: 'marketing/customer-engagement',
          name: 'customer-engagement',
          component: () => import('../views/marketing/CustomerEngagement.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'DELIVERY_MARKETING' },
        },
        // Inventory Management
        {
          path: 'inventory/suppliers',
          name: 'suppliers',
          component: () => import('../views/inventory/Suppliers.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'inventory/purchase-orders',
          name: 'purchase-orders',
          component: () => import('../views/inventory/PurchaseOrders.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'inventory/stock-transfers',
          name: 'stock-transfers',
          component: () => import('../views/inventory/StockTransfers.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'inventory/stock-alerts',
          name: 'stock-alerts',
          component: () => import('../views/inventory/StockAlerts.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        // Advanced Reporting
        {
          path: 'reports/advanced',
          name: 'advanced-reporting',
          component: () => import('../views/reports/AdvancedReporting.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        // Financial Management Enhancement
        {
          path: 'finance/management',
          name: 'financial-management',
          component: () => import('../views/finance/FinancialManagement.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        // AI/ML Features
        {
          path: 'ai-ml',
          name: 'ai-ml-features',
          component: () => import('../views/ai-ml/AIMLFeatures.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('../views/analytics/AdvancedAnalytics.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        {
          path: 'finance',
          name: 'finance',
          component: () => import('../views/finance/AccountingFinance.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        {
          path: 'profit-loss',
          name: 'profit-loss',
          component: () => import('../views/finance/ProfitLossReport.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'], requiresAddon: 'BUSINESS_ANALYTICS' },
        },
        {
          path: 'settings/store',
          name: 'store-settings',
          component: () => import('../views/settings/StoreSettings.vue'),
          meta: { roles: ['ADMIN_TENANT'] },
        },
        {
          path: 'settings/2fa',
          name: 'two-factor-auth',
          component: () => import('../views/settings/TwoFactorAuth.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/webhooks',
          name: 'webhooks',
          component: () => import('../views/settings/Webhooks.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/webhooks/tester',
          name: 'webhook-tester',
          component: () => import('../views/settings/WebhookTester.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/sessions',
          name: 'sessions',
          component: () => import('../views/settings/Sessions.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/password',
          name: 'password-settings',
          component: () => import('../views/settings/PasswordSettings.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/gdpr',
          name: 'gdpr-settings',
          component: () => import('../views/settings/GDPRSettings.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/archive',
          name: 'archive-management',
          component: () => import('../views/settings/ArchiveManagement.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'settings/retention',
          name: 'retention-management',
          component: () => import('../views/settings/RetentionManagement.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'products/adjustments',
          name: 'product-adjustments',
          component: () => import('../views/products/ProductAdjustments.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'receipts/templates',
          name: 'receipt-templates',
          component: () => import('../views/receipts/ReceiptTemplates.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
        },
        {
          path: 'stores',
          name: 'stores',
          component: () => import('../views/stores/Stores.vue'),
          meta: { roles: ['ADMIN_TENANT', 'SUPERVISOR', 'SUPER_ADMIN'] },
        },
        // Kasir and Admin Tenant
        {
          path: 'pos',
          name: 'pos',
          component: () => import('../views/pos/POS.vue'),
          meta: { roles: ['CASHIER', 'ADMIN_TENANT'] },
        },
        // Kitchen only
        {
          path: 'orders/kitchen',
          name: 'kitchen-orders',
          component: () => import('../views/kitchen/KitchenOrders.vue'),
          meta: { roles: ['KITCHEN'] },
        },
      ],
    },
    // Unauthorized page
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('../views/Unauthorized.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue'),
    },
  ],
});

// Role-based route guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // If going to login page, skip all checks to avoid flash
  if (to.name === 'login') {
    // If already authenticated, redirect to dashboard
    const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (hasToken && authStore.isAuthenticated) {
      next({ name: 'dashboard' });
      return;
    }
    // Otherwise, allow access to login page immediately
    next();
    return;
  }
  
  // Check token first (synchronous) to avoid flash during logout
  const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // If route requires auth but no token, redirect immediately without async operations
  if (to.meta.requiresAuth && !hasToken) {
    authStore.clearAuth();
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  
  // If route requires auth and has token, check authentication
  if (to.meta.requiresAuth && hasToken) {
    // If user object is missing, try to restore session (only if not already clearing)
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (!authStore.user && rememberMe) {
      try {
        await authStore.fetchMe();
      } catch (error) {
        console.error('Failed to restore session:', error);
        authStore.clearAuth();
        localStorage.removeItem('rememberMe');
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
      }
    }
    
    // Final check: if still not authenticated after restore, redirect
    if (!authStore.isAuthenticated) {
      authStore.clearAuth();
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }
  
  // Role-based access control
  if (to.meta.roles && authStore.user) {
    const userRole = authStore.user.role;
    const allowedRoles = to.meta.roles as string[];
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to dashboard instead of unauthorized for better UX
      // Supervisor should not see unauthorized page
      next({ name: 'dashboard' });
      return;
    }
    
    // Permission-based access control for specific roles (e.g., CASHIER)
    if (to.meta.requiresPermission && authStore.user) {
      const { role: requiredRole, permission: requiredPermission } = to.meta.requiresPermission as { role: string; permission: string };
      
      // Only check permission if user role matches required role
      if (userRole === requiredRole) {
        const userPermissions = (authStore.user as any).permissions || {};
        const hasPermission = userPermissions[requiredPermission] === true;
        
        if (!hasPermission) {
          // Redirect to dashboard if permission not granted
          next({ name: 'dashboard' });
          return;
        }
      }
    }
  }
  
  // Legacy admin check (for backward compatibility)
  if (to.meta.requiresAdmin && authStore.user?.role !== 'ADMIN_TENANT' && authStore.user?.role !== 'SUPER_ADMIN') {
    next({ name: 'dashboard' });
    return;
  }
  
  // Addon-based access control
  // Super Admin and Admin Tenant bypass addon check for basic analytics
  if (to.meta.requiresAddon && authStore.isAuthenticated) {
    const userRole = authStore.user?.role;
    const requiredAddon = to.meta.requiresAddon as string;
    
    // Super Admin bypass all addon checks
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    // Admin Tenant bypass addon check for BUSINESS_ANALYTICS (basic analytics access)
    if (userRole === 'ADMIN_TENANT' && requiredAddon === 'BUSINESS_ANALYTICS') {
      next();
      return;
    }
    
    // For other roles or addons, check if addon is active
    try {
      const { default: api } = await import('../api');
      const response = await api.get('/addons');
      const activeAddons = response.data || [];
      
      const hasAddon = activeAddons.some(
        (addon: any) => addon.addonType === requiredAddon && addon.status === 'active'
      );
      
      if (!hasAddon) {
        next({ name: 'unauthorized', query: { reason: 'addon', addon: requiredAddon } });
        return;
      }
    } catch (error: any) {
      // If error loading addons, allow access (will be handled by backend)
      console.error('Error checking addon:', error);
    }
  }
  
  next();
});

export default router;

