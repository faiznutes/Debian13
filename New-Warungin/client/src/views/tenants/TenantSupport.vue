<template>
  <div class="flex flex-col h-full">
    <!-- Header with Tenant Selector -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Tenant Support</h2>
          <p class="text-gray-600">Kelola dan dukung tenant yang membutuhkan bantuan</p>
        </div>
      </div>

      <!-- Tenant Selector -->
      <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Pilih Tenant <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <select
            v-model="selectedTenantId"
            @change="handleTenantChange"
            class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer"
            :class="{ 'border-red-300': !selectedTenantId && showError }"
          >
            <option value="">-- Pilih Tenant --</option>
            <option 
              v-for="tenant in tenants" 
              :key="tenant.id" 
              :value="tenant.id"
            >
              {{ tenant.name }} {{ tenant.isActive === false ? '(Tidak Aktif)' : '' }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p v-if="!selectedTenantId && showError" class="mt-2 text-sm text-red-600">
          Silakan pilih tenant terlebih dahulu
        </p>
        <div v-if="selectedTenant" class="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tenant: <strong class="text-gray-900">{{ selectedTenant.name }}</strong></span>
          <span class="px-2 py-1 text-xs rounded-full" :class="selectedTenant.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
            {{ selectedTenant.isActive === false ? 'Tidak Aktif' : 'Aktif' }}
          </span>
        </div>
      </div>
      
      <!-- Store Selector (only show when tenant is selected) -->
      <div v-if="selectedTenantId" class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mt-4">
        <StoreSelector @store-changed="handleStoreChange" />
      </div>
    </div>

    <!-- Tabs -->
    <div v-if="selectedTenantId" class="flex-1 flex flex-col">
      <!-- Tab Navigation -->
      <div class="bg-white rounded-lg shadow-sm mb-4">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center gap-2">
                <component :is="tab.icon" />
                <span>{{ tab.label }}</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-auto">
        <!-- Dashboard Tab -->
        <div v-if="activeTab === 'dashboard'" class="h-full">
          <TenantDashboard :tenant-id="selectedTenantId" />
        </div>

        <!-- Products Tab -->
        <div v-if="activeTab === 'products'" class="h-full">
          <TenantProducts :tenant-id="selectedTenantId" />
        </div>

        <!-- Orders Tab -->
        <div v-if="activeTab === 'orders'" class="h-full">
          <TenantOrders :tenant-id="selectedTenantId" />
        </div>

        <!-- Reports Tab -->
        <div v-if="activeTab === 'reports'" class="h-full">
          <TenantReports :tenant-id="selectedTenantId" />
        </div>

        <!-- POS Tab -->
        <div v-if="activeTab === 'pos'" class="h-full">
          <TenantPOS :tenant-id="selectedTenantId" />
        </div>

        <!-- Kitchen Tab -->
        <div v-if="activeTab === 'kitchen'" class="h-full">
          <TenantKitchen :tenant-id="selectedTenantId" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center bg-white rounded-lg shadow-sm">
      <div class="text-center">
        <svg class="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Pilih Tenant</h3>
        <p class="text-gray-600">Silakan pilih tenant dari dropdown di atas untuk mulai mengelola</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { useAuthStore } from '../../stores/auth';
import api from '../../api';
import TenantDashboard from './components/TenantDashboard.vue';
import TenantProducts from './components/TenantProducts.vue';
import TenantOrders from './components/TenantOrders.vue';
import TenantReports from './components/TenantReports.vue';
import TenantPOS from './components/TenantPOS.vue';
import TenantKitchen from './components/TenantKitchen.vue';
import StoreSelector from '../../components/StoreSelector.vue';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const { error: showErrorNotification } = useNotification();

const tenants = ref<any[]>([]);
const selectedTenantId = ref<string>('');
const activeTab = ref<string>('dashboard');
const showError = ref(false);
const loading = ref(false);

const tabs = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
    ])
  },
  { 
    id: 'products', 
    label: 'Produk', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' })
    ])
  },
  { 
    id: 'orders', 
    label: 'Pesanan', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' })
    ])
  },
  { 
    id: 'reports', 
    label: 'Laporan', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  },
  { 
    id: 'pos', 
    label: 'POS', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  },
  { 
    id: 'kitchen', 
    label: 'Kitchen', 
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
    ])
  },
];

const selectedTenant = computed(() => {
  if (!selectedTenantId.value) return null;
  return tenants.value.find(t => t.id === selectedTenantId.value);
});

const loadTenants = async () => {
  loading.value = true;
  try {
    const response = await api.get('/tenants');
    const tenantList = response.data.data || response.data;
    // Filter out System tenant (double check, backend already filters)
    tenants.value = Array.isArray(tenantList) 
      ? tenantList.filter((tenant: any) => tenant.name !== 'System')
      : [];
  } catch (error: any) {
    console.error('Error loading tenants:', error);
    await showErrorNotification('Gagal memuat daftar tenant');
  } finally {
    loading.value = false;
  }
};

const handleTenantChange = () => {
  showError.value = false;
  if (selectedTenantId.value) {
    // Set selected tenant in auth store and localStorage
    // This ensures API interceptor can access it
    authStore.setSelectedTenant(selectedTenantId.value);
    localStorage.setItem('selectedTenantId', selectedTenantId.value);
  } else {
    authStore.setSelectedTenant(null);
    localStorage.removeItem('selectedTenantId');
  }
};

const handleStoreChange = (storeId: string | null) => {
  // Store selection is handled by StoreSelector component
  // This function is just for event handling if needed
  console.log('Store changed:', storeId);
};

// Watch for selectedTenantId changes
watch(selectedTenantId, (newId) => {
  if (newId) {
    authStore.setSelectedTenant(newId);
    localStorage.setItem('selectedTenantId', newId);
  } else {
    authStore.setSelectedTenant(null);
    localStorage.removeItem('selectedTenantId');
  }
});

onMounted(async () => {
  await loadTenants();
  // If there's a previously selected tenant, use it
  if (authStore.selectedTenantId) {
    selectedTenantId.value = authStore.selectedTenantId;
  }
});
</script>

