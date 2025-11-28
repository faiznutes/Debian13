import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);
  const tenants = ref<Tenant[]>([]);
  const selectedTenantId = ref<string | null>(localStorage.getItem('selectedTenantId'));
  const selectedStoreId = ref<string | null>(localStorage.getItem('selectedStoreId'));

  const isAuthenticated = computed(() => {
    // Check if token exists (either in localStorage or sessionStorage)
    const hasToken = token.value || localStorage.getItem('token') || sessionStorage.getItem('token');
    // Return false immediately if no token to avoid flash
    if (!hasToken) {
      return false;
    }
    // Also check user object exists
    return !!user.value;
  });
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN');
  const currentTenantId = computed(() => {
    if (isSuperAdmin.value && selectedTenantId.value) {
      return selectedTenantId.value;
    }
    return user.value?.tenantId || null;
  });

  const currentStoreId = computed(() => selectedStoreId.value);

  const setAuth = (newToken: string, userData: User, remember: boolean = false) => {
    token.value = newToken;
    user.value = userData;
    
    // Store token based on remember me preference
    if (remember) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('rememberMe', 'true');
    } else {
      sessionStorage.setItem('token', newToken);
      localStorage.removeItem('rememberMe');
      // Also store in localStorage for immediate access
      localStorage.setItem('token', newToken);
    }
    
    // Always store user data in localStorage for faster access
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    tenants.value = []; // Clear tenants on logout
    selectedTenantId.value = null; // Clear selected tenant on logout
    localStorage.removeItem('selectedTenantId'); // Clear from local storage
    selectedStoreId.value = null; // Clear selected store on logout
    localStorage.removeItem('selectedStoreId'); // Clear from local storage
  };
  
  // Restore user from localStorage on init
  const restoreUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        user.value = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Failed to restore user:', error);
    }
  };
  
  // Initialize user from localStorage
  restoreUser();

  const login = async (email: string, password: string, remember: boolean = false) => {
    const response = await api.post('/auth/login', { email, password });
    // Ensure permissions are included in user object
    const userData = response.data.user;
    const token = response.data.token;
    
    // IMPORTANT: Set token FIRST before calling /auth/me
    // This ensures the Authorization header is included in the request
    setAuth(token, userData, remember);
    
    // Always fetch fresh user data including permissions from /auth/me
    // This ensures we have the latest permissions and all user data
    try {
      const meResponse = await api.get('/auth/me');
      if (meResponse.data.user) {
        // Merge permissions from /auth/me into userData
        userData.permissions = meResponse.data.user.permissions || null;
        // Also update other fields that might be more up-to-date
        userData.tenantName = meResponse.data.user.tenantName || userData.tenantName;
        userData.isActive = meResponse.data.user.isActive !== undefined ? meResponse.data.user.isActive : userData.isActive;
        // Update stored user data with fresh data from /auth/me
        user.value = meResponse.data.user;
        localStorage.setItem('user', JSON.stringify(meResponse.data.user));
      }
    } catch (error) {
      console.warn('Failed to fetch user permissions after login:', error);
      // If /auth/me fails, use permissions from login response if available
      if (!userData.permissions) {
        userData.permissions = null;
      }
    }
    
    return response.data;
  };

  // Register removed - only super admin can create tenants

  const logout = () => {
    clearAuth();
    tenants.value = [];
    selectedTenantId.value = null;
    localStorage.removeItem('selectedTenantId');
    // Clear any pending requests by redirecting immediately
    // This prevents any pending API calls from showing error messages
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants');
      // Handle different response formats
      let tenantList: any[] = [];
      if (Array.isArray(response.data)) {
        tenantList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        tenantList = response.data.data;
      }
      
      // Filter out System tenant (double check, backend already filters)
      tenants.value = tenantList.filter(tenant => tenant.name !== 'System');
      return tenants.value;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      tenants.value = [];
      return [];
    }
  };

  const setSelectedTenant = (tenantId: string | null) => {
    selectedTenantId.value = tenantId;
    if (tenantId) {
      localStorage.setItem('selectedTenantId', tenantId);
    } else {
      localStorage.removeItem('selectedTenantId');
    }
    // Clear store selection when tenant changes
    selectedStoreId.value = null;
    localStorage.removeItem('selectedStoreId');
  };

  const setSelectedStore = (storeId: string | null) => {
    selectedStoreId.value = storeId;
    if (storeId) {
      localStorage.setItem('selectedStoreId', storeId);
    } else {
      localStorage.removeItem('selectedStoreId');
    }
  };

  const fetchMe = async () => {
    try {
      // Ensure token is available
      const currentToken = token.value || localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!currentToken) {
        throw new Error('No token available');
      }
      
      // Set token in store if not already set
      if (!token.value && currentToken) {
        token.value = currentToken;
      }
      
      const response = await api.get('/auth/me');
      user.value = response.data.user;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Auto-set store for cashier/kitchen from permissions
      if (user.value && (user.value.role === 'CASHIER' || user.value.role === 'KITCHEN')) {
        const permissions = (user.value as any).permissions;
        if (permissions?.assignedStoreId) {
          setSelectedStore(permissions.assignedStoreId);
        }
      }
      
      return response.data;
    } catch (error) {
      // Only clear auth if it's a real authentication error (401 or 404)
      // Don't clear if it's just a network error or server error (500)
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { status?: number } };
        const status = httpError.response?.status;
        if (status === 401 || status === 404) {
          clearAuth();
        }
        // For 500 errors, log but don't clear auth (might be temporary server issue)
        if (status === 500) {
          console.error('Server error in /auth/me:', error);
        }
      }
      throw error;
    }
  };

  return {
    token,
    user,
    tenants,
    selectedTenantId,
    selectedStoreId,
    isAuthenticated,
    isSuperAdmin,
    currentTenantId,
    currentStoreId,
    login,
    logout,
    fetchMe,
    fetchTenants,
    setSelectedTenant,
    setSelectedStore,
    clearAuth, // Export clearAuth for use in App.vue
  };
});

