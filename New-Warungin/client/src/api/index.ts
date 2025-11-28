import axios from 'axios';

// Determine API URL based on environment
const getApiUrl = () => {
  // In production, use VITE_API_URL or detect from window location
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If running in production (not localhost), use current domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // If not localhost, use current domain
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // Increased to 30 seconds for complex queries like tenants
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get user role from token (decode JWT)
const getUserRole = (): string | null => {
  try {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token from response header if available
    // Note: CSRF token is optional for JWT-based auth, but adds extra security
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add tenantId query param for super admin (but not for /auth/me, /pdf/generate, etc.)
    const userRole = getUserRole();
    const selectedTenantId = localStorage.getItem('selectedTenantId');
    const selectedStoreId = localStorage.getItem('selectedStoreId');
    const isAuthMeRoute = config.url?.includes('/auth/me');
    
    // Get the URL path (remove baseURL if present)
    const urlPath = config.url?.replace(/^https?:\/\/[^\/]+/, '') || config.url || '';
    
    // Skip routes that don't need tenantId
    const isPdfRoute = urlPath.includes('/pdf/generate');
    const isAuthRoute = isAuthMeRoute || urlPath.includes('/auth/');
    
    if (userRole === 'SUPER_ADMIN' && selectedTenantId && !isAuthRoute && !isPdfRoute) {
      // Only add tenantId if not already in params or URL
      
      // Check if tenantId is already in URL (query parameter)
      const urlHasTenantId = urlPath.includes('tenantId=');
      
      // Check if tenantId is in path parameter (e.g., /tenants/{tenantId}/...)
      // Pattern: /tenants/{uuid}/... or /tenants/{uuid}?... 
      // UUID format: 8-4-4-4-12 hex characters (e.g., 1ee316de-cb42-42d9-93d3-412c7a1ac406)
      const pathHasTenantId = /\/tenants\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(\/|$|\?)/i.test(urlPath);
      
      // Check if tenantId is in rewards/tenant path (e.g., /rewards/tenant/{tenantId}/balance)
      const rewardsTenantPath = /\/rewards\/tenant\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(\/|$|\?)/i.test(urlPath);
      
      // Also check if tenantId is already in config.params (from previous interceptor call or manual setting)
      const paramsHasTenantId = config.params && 'tenantId' in config.params;
      
      // Don't add tenantId if:
      // 1. Already in query parameter
      // 2. Already in path parameter (for routes like /tenants/:id/upgrade-plan, /tenants/:id, etc.)
      // 3. Already in rewards/tenant path (for routes like /rewards/tenant/:id/balance)
      // 4. Already in config.params
      // 5. Route is /tenants (list all tenants, doesn't need tenantId)
      const isTenantsListRoute = /^\/tenants(\?|$)/.test(urlPath);
      const shouldSkipTenantId = urlHasTenantId || pathHasTenantId || rewardsTenantPath || paramsHasTenantId || isTenantsListRoute;
      
      if (!shouldSkipTenantId) {
        if (!config.params) {
          config.params = {};
        }
        if (!config.params.tenantId) {
          config.params.tenantId = selectedTenantId;
        }
      }
    }
    
    // Add outletId query param if selectedStoreId exists (for all users, not just super admin)
    // Skip for /outlets routes (list/create outlets), /auth routes, and /pdf routes
    if (selectedStoreId && !isAuthRoute && !isPdfRoute) {
      const isOutletsRoute = /^\/outlets(\?|$)/.test(urlPath) || /^\/outlets\/[^\/]+$/.test(urlPath);
      const urlHasOutletId = urlPath.includes('outletId=');
      const paramsHasOutletId = config.params && 'outletId' in config.params;
      
      // Add outletId to requests that need store filtering (products, orders, reports, etc.)
      // But not to /outlets routes themselves
      if (!isOutletsRoute && !urlHasOutletId && !paramsHasOutletId) {
        if (!config.params) {
          config.params = {};
        }
        if (!config.params.outletId) {
          config.params.outletId = selectedStoreId;
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle CORS and 204 responses silently, then handle auth errors
api.interceptors.response.use(
  (response) => {
    // If it's a 204 (preflight OPTIONS), don't process it
    if (response.status === 204 && response.config?.method === 'options') {
      // Return a resolved promise with empty data to prevent error
      return Promise.resolve({ ...response, data: null });
    }
    return response;
  },
  (error) => {
    // Silently handle CORS preflight errors and 204 responses
    if (error.config?.method === 'options' || error.response?.status === 204) {
      // This is a preflight OPTIONS request, which is normal
      // Return a resolved promise to prevent error from being thrown
      return Promise.resolve({ 
        status: 204, 
        statusText: 'No Content',
        data: null,
        headers: {},
        config: error.config 
      });
    }
    
    // Silently handle CORS errors if they're just preflight issues
    const isCorsError = error.code === 'ERR_NETWORK' || 
                       error.message?.includes('CORS') || 
                       error.message?.includes('Access-Control') ||
                       error.message?.includes('ERR_FAILED');
    
    // If it's a CORS error but the request was for PDF generation, 
    // it might be a false positive (IDM intercept, etc.)
    if (isCorsError && error.config?.url?.includes('/pdf/generate')) {
      // Check if it's actually a successful response that was intercepted
      // Return a resolved promise to prevent error from being thrown
      // The actual download might have succeeded
      return Promise.resolve({ 
        status: 200, 
        statusText: 'OK',
        data: null,
        headers: {},
        config: error.config 
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Only clear auth if it's a real authentication error
      // Don't clear if it's just a missing token (user might be on public page)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        // Token exists but server rejected it, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedTenantId');
        sessionStorage.removeItem('token');
        
        // Only redirect if we're on an authenticated route
        if (window.location.pathname.startsWith('/app')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle subscription expired error
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      // Store subscription error message for display
      const message = error.response.data.message || 'Langganan telah kedaluwarsa. Silakan perpanjang langganan untuk melanjutkan menggunakan layanan.';
      error.subscriptionExpired = true;
      error.subscriptionMessage = message;
    }
    
    return Promise.reject(error);
  }
);

export default api;

