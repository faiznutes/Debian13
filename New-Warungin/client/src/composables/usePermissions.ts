import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

export interface UserPermissions {
  canEditOrders?: boolean;
  canDeleteOrders?: boolean;
  canCancelOrders?: boolean;
  canRefundOrders?: boolean;
  canViewReports?: boolean;
  canEditReports?: boolean;
  canExportReports?: boolean;
  canManageProducts?: boolean;
  canManageCustomers?: boolean;
}

export function usePermissions() {
  const authStore = useAuthStore();

  const userPermissions = computed<UserPermissions | null>(() => {
    if (!authStore.user) return null;
    
    // Admin and Super Admin have all permissions
    if (authStore.user.role === 'ADMIN_TENANT' || authStore.user.role === 'SUPER_ADMIN') {
      return {
        canEditOrders: true,
        canDeleteOrders: true,
        canCancelOrders: true,
        canRefundOrders: true,
        canViewReports: true,
        canEditReports: true,
        canExportReports: true,
        canManageProducts: true,
        canManageCustomers: true,
      };
    }

    // For CASHIER and SUPERVISOR, check permissions from user object
    // Note: permissions should be stored in user object from API
    const permissions = (authStore.user as any).permissions as UserPermissions | undefined;
    return permissions || {};
  });

  const canEditOrders = computed(() => userPermissions.value?.canEditOrders ?? false);
  const canDeleteOrders = computed(() => userPermissions.value?.canDeleteOrders ?? false);
  const canCancelOrders = computed(() => userPermissions.value?.canCancelOrders ?? false);
  const canRefundOrders = computed(() => userPermissions.value?.canRefundOrders ?? false);
  const canViewReports = computed(() => userPermissions.value?.canViewReports ?? false);
  const canEditReports = computed(() => userPermissions.value?.canEditReports ?? false);
  const canExportReports = computed(() => userPermissions.value?.canExportReports ?? false);
  const canManageProducts = computed(() => userPermissions.value?.canManageProducts ?? false);
  const canManageCustomers = computed(() => userPermissions.value?.canManageCustomers ?? false);

  return {
    userPermissions,
    canEditOrders,
    canDeleteOrders,
    canCancelOrders,
    canRefundOrders,
    canViewReports,
    canEditReports,
    canExportReports,
    canManageProducts,
    canManageCustomers,
  };
}

