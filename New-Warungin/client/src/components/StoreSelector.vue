<template>
  <div v-if="shouldShow" class="mb-4 sm:mb-6">
    <div class="flex items-center gap-3 flex-wrap">
      <label for="store-select" class="text-sm font-medium text-gray-700 whitespace-nowrap">
        Pilih Store:
      </label>
      <div class="flex-1 max-w-xs relative">
        <select
          id="store-select"
          :value="selectedStoreId || ''"
          @change="handleStoreChange"
          :disabled="loading"
          class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Semua Store</option>
          <option 
            v-for="store in stores" 
            :key="store.id" 
            :value="store.id"
          >
            {{ store.name }}
          </option>
        </select>
        <!-- Custom dropdown arrow -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            class="w-5 h-5 text-gray-400"
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
      <!-- Clear button (only show when store is selected) -->
      <button
        v-if="selectedStoreId && !loading"
        @click="clearSelection"
        type="button"
        class="px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-gray-300 hover:border-red-300"
        title="Tampilkan semua store"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <!-- Selected store info -->
    <div v-if="selectedStoreId && selectedStoreName" class="mt-2 flex items-center gap-2 text-xs text-gray-600">
      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Menampilkan data: <strong class="text-gray-900">{{ selectedStoreName }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

interface Props {
  placeholder?: string;
  showInfo?: boolean;
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih Store',
  showInfo: true,
  autoLoad: true,
});

const emit = defineEmits<{
  'store-changed': [storeId: string | null];
}>();

const authStore = useAuthStore();
const stores = ref<any[]>([]);
const loading = ref(false);
const selectedStoreId = ref<string | null>(
  localStorage.getItem('selectedStoreId')
);

const shouldShow = computed(() => {
  // Show if user is not super admin, or if super admin has selected a tenant
  if (authStore.isSuperAdmin) {
    return !!authStore.selectedTenantId;
  }
  return true;
});

const selectedStoreName = computed(() => {
  if (!selectedStoreId.value) return '';
  const store = stores.value.find(s => s.id === selectedStoreId.value);
  return store?.name || '';
});

const loadStores = async () => {
  if (!shouldShow.value) return;
  
  loading.value = true;
  try {
    const response = await api.get('/outlets');
    stores.value = response.data.data || [];
    
    // If no store selected but stores exist, select first one if only one store
    if (!selectedStoreId.value && stores.value.length === 1) {
      handleStoreChange({ target: { value: stores.value[0].id } } as any);
    }
  } catch (error: any) {
    console.error('Error loading stores:', error);
    stores.value = [];
  } finally {
    loading.value = false;
  }
};

const handleStoreChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const storeId = target.value || null;
  selectedStoreId.value = storeId;
  
  if (storeId) {
    localStorage.setItem('selectedStoreId', storeId);
    authStore.setSelectedStore(storeId);
  } else {
    localStorage.removeItem('selectedStoreId');
    authStore.setSelectedStore(null);
  }
  
  emit('store-changed', storeId);
};

const clearSelection = () => {
  selectedStoreId.value = null;
  localStorage.removeItem('selectedStoreId');
  authStore.setSelectedStore(null);
  emit('store-changed', null);
};

watch(() => authStore.selectedTenantId, (newTenantId) => {
  if (newTenantId && authStore.isSuperAdmin) {
    // Clear store selection when tenant changes
    clearSelection();
    loadStores();
  }
});

watch(() => shouldShow.value, (show) => {
  if (show && props.autoLoad) {
    loadStores();
  }
}, { immediate: true });

onMounted(() => {
  if (props.autoLoad && shouldShow.value) {
    loadStores();
  }
});
</script>

