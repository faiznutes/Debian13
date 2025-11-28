<template>
  <div v-if="authStore.isSuperAdmin" class="mb-6">
    <div class="flex items-center gap-3">
      <label for="tenant-select" class="text-sm font-medium text-gray-700 whitespace-nowrap">
        Pilih Tenant:
      </label>
      <div class="flex-1 max-w-xs relative">
        <select
          id="tenant-select"
          :value="authStore.selectedTenantId || ''"
          @change="handleTenantChange"
          :disabled="loading"
          class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{{ placeholder }}</option>
          <option 
            v-for="tenant in tenants" 
            :key="tenant.id" 
            :value="tenant.id"
          >
            {{ tenant.name }}
          </option>
        </select>
        <!-- Custom dropdown arrow -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': showDropdown }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <!-- Loading indicator -->
        <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-10">
          <div class="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <!-- Clear button (only show when tenant is selected) -->
      <button
        v-if="authStore.selectedTenantId && !loading"
        @click="clearSelection"
        type="button"
        class="px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-gray-300 hover:border-red-300"
        title="Hapus pilihan tenant"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <!-- Selected tenant info (subtle) -->
    <div v-if="authStore.selectedTenantId && selectedTenantName" class="mt-2 flex items-center gap-2 text-xs text-gray-600">
      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Menampilkan data: <strong class="text-gray-900">{{ selectedTenantName }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';

interface Props {
  placeholder?: string;
  showInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih Tenant',
  showInfo: true,
});

const emit = defineEmits<{
  'tenant-changed': [tenantId: string | null];
}>();

const authStore = useAuthStore();
const tenants = ref<any[]>([]);
const loading = ref(false);
const showDropdown = ref(false);

const selectedTenantName = computed(() => {
  if (!authStore.selectedTenantId) return '';
  const tenant = tenants.value.find(t => t.id === authStore.selectedTenantId);
  return tenant?.name || '';
});

const loadTenants = async () => {
  // Use cached tenants if available
  if (authStore.tenants.length > 0) {
    tenants.value = authStore.tenants;
    return;
  }
  
  loading.value = true;
  try {
    await authStore.fetchTenants();
    tenants.value = authStore.tenants;
  } catch (error) {
    console.error('Error loading tenants:', error);
  } finally {
    loading.value = false;
  }
};

const handleTenantChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const tenantId = target.value || null;
  
  if (tenantId) {
    authStore.setSelectedTenant(tenantId);
    emit('tenant-changed', tenantId);
  } else {
    clearSelection();
  }
};

const clearSelection = () => {
  authStore.setSelectedTenant(null);
  emit('tenant-changed', null);
};

// Watch for super admin status and load tenants
watch(() => authStore.isSuperAdmin, (isSuperAdmin) => {
  if (isSuperAdmin) {
    loadTenants();
  }
}, { immediate: true });

// Watch for tenant list updates
watch(() => authStore.tenants, (newTenants) => {
  if (newTenants.length > 0) {
    tenants.value = newTenants;
  }
}, { deep: true });

onMounted(() => {
  if (authStore.isSuperAdmin) {
    loadTenants();
  }
});
</script>

<style scoped>
/* Custom select styling */
select {
  background-image: none;
}

select::-ms-expand {
  display: none;
}
</style>
