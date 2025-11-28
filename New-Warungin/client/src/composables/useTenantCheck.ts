import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

export const useTenantCheck = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const showTenantModal = ref(false);

  const needsTenantSelection = computed(() => {
    return authStore.isSuperAdmin && !authStore.selectedTenantId;
  });

  const checkTenantBeforeAction = (callback: () => void) => {
    if (needsTenantSelection.value) {
      showTenantModal.value = true;
    } else {
      callback();
    }
  };

  const handleTenantSelected = async (tenantId?: string) => {
    if (tenantId) {
      authStore.setSelectedTenant(tenantId);
      showTenantModal.value = false;
      // Force reload to refresh data with new tenant
      window.location.reload();
    }
  };

  // Watch for Super Admin login and fetch tenants
  watch(
    () => authStore.isSuperAdmin,
    async (isSuperAdmin) => {
      if (isSuperAdmin && authStore.tenants.length === 0) {
        try {
          await authStore.fetchTenants();
        } catch (error) {
          console.error('Error fetching tenants:', error);
        }
      }
    },
    { immediate: true }
  );

  // Watch for selectedTenantId changes and auto-close modal
  watch(
    () => authStore.selectedTenantId,
    (newTenantId) => {
      if (newTenantId && showTenantModal.value) {
        showTenantModal.value = false;
      }
    }
  );

  return {
    needsTenantSelection,
    showTenantModal,
    checkTenantBeforeAction,
    handleTenantSelected,
  };
};

