import { watch, ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';

/**
 * Composable untuk auto-refetch data saat tenant berubah
 * 
 * @param fetchData - Function untuk fetch data
 * @param options - Options untuk watch behavior
 * @returns { loading, error, refetch }
 */
export function useTenantData<T = any>(
  fetchData: (tenantId: string) => Promise<T>,
  options: {
    immediate?: boolean;
    onError?: (error: any) => void;
    onSuccess?: (data: T) => void;
  } = {}
) {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<any>(null);
  const data = ref<T | null>(null);

  const { immediate = true, onError, onSuccess } = options;

  const refetch = async () => {
    const tenantId = authStore.currentTenantId;
    
    // Jika Super Admin dan belum pilih tenant, jangan fetch
    if (authStore.isSuperAdmin && !tenantId) {
      data.value = null;
      return;
    }

    // Jika bukan Super Admin tapi tidak ada tenantId, jangan fetch
    if (!authStore.isSuperAdmin && !tenantId) {
      data.value = null;
      return;
    }

    if (!tenantId) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await fetchData(tenantId);
      data.value = result;
      onSuccess?.(result);
    } catch (err) {
      error.value = err;
      onError?.(err);
      console.error('Error fetching tenant data:', err);
    } finally {
      loading.value = false;
    }
  };

  // Watch untuk perubahan tenantId
  watch(
    () => authStore.currentTenantId,
    (newTenantId, oldTenantId) => {
      // Hanya refetch jika tenantId benar-benar berubah
      if (newTenantId !== oldTenantId) {
        refetch();
      }
    },
    { immediate }
  );

  // Watch untuk perubahan selectedTenantId (untuk Super Admin)
  if (authStore.isSuperAdmin) {
    watch(
      () => authStore.selectedTenantId,
      (newTenantId, oldTenantId) => {
        if (newTenantId !== oldTenantId) {
          refetch();
        }
      },
      { immediate }
    );
  }

  // Initial fetch
  onMounted(() => {
    if (immediate) {
      refetch();
    }
  });

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Composable untuk check apakah tenant sudah dipilih
 * Menampilkan pesan jika belum dipilih
 */
export function useTenantCheck() {
  const authStore = useAuthStore();

  const needsTenantSelection = computed(() => {
    return authStore.isSuperAdmin && !authStore.selectedTenantId;
  });

  const currentTenantId = computed(() => {
    return authStore.currentTenantId;
  });

  const tenantMessage = computed(() => {
    if (needsTenantSelection.value) {
      return 'Silakan pilih tenant terlebih dahulu untuk melihat data.';
    }
    return null;
  });

  return {
    needsTenantSelection,
    currentTenantId,
    tenantMessage,
  };
}

