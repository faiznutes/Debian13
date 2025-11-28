<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Addon</h2>
    </div>

    <!-- Tenant Selection Message -->
    <div v-if="needsTenantSelection" class="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <svg class="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Pilih Tenant Terlebih Dahulu</h3>
      <p class="text-gray-600 text-center max-w-md">Silakan pilih tenant terlebih dahulu untuk melihat dan mengelola addon</p>
    </div>

    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-gray-600 font-medium">Memuat addon...</div>
      </div>
    </div>

    <div v-else class="flex flex-col space-y-6">
      <!-- Active Addons -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Addon Aktif</h3>
        <div v-if="activeAddons.length === 0" class="text-center py-8 text-gray-500">
          Belum ada addon yang aktif
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="addon in activeAddons"
            :key="addon.id"
            class="border-2 border-primary-200 rounded-lg p-4 bg-primary-50"
          >
            <div class="flex items-start justify-between mb-3">
              <h4 class="font-semibold text-gray-900">{{ addon.addonName }}</h4>
              <span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Aktif</span>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ getAddonDescription(addon) }}</p>
            <div v-if="addon.limit" class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Penggunaan:</span>
                <span class="font-semibold" :class="addon.isLimitReached ? 'text-red-600' : 'text-gray-900'">
                  {{ addon.currentUsage }} / {{ addon.limit }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="addon.isLimitReached ? 'bg-red-500' : 'bg-primary-600'"
                  :style="{ width: `${Math.min(100, ((addon.currentUsage || 0) / (addon.limit || 1)) * 100)}%` }"
                ></div>
              </div>
            </div>
            <button
              @click="unsubscribeAddon(addon.addonId)"
              class="mt-3 w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            >
              Nonaktifkan
            </button>
          </div>
        </div>
      </div>

      <!-- Available Addons -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Addon Tersedia</h3>
        <div v-if="filteredAvailableAddons.length === 0" class="text-center py-8 text-gray-500">
          Semua addon sudah aktif
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="addon in filteredAvailableAddons"
            :key="addon.id"
            class="border-2 border-gray-200 rounded-lg p-4 transition hover:border-primary-300"
          >
            <h4 class="font-semibold text-gray-900 mb-2">{{ addon.name }}</h4>
            <p class="text-sm text-gray-600 mb-3">{{ addon.description }}</p>
            
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-lg font-bold text-primary-600">{{ formatCurrency(addon.price) }}</span>
                <span class="text-sm text-gray-500">/bulan</span>
              </div>
            </div>
            <div v-if="addon.defaultLimit" class="text-sm text-gray-600 mb-3">
              Limit: {{ addon.defaultLimit }}
            </div>
            <button
              @click="subscribeAddon(addon)"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Berlangganan
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelector from '../../components/TenantSelector.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

const loading = ref(false);
const availableAddons = ref<any[]>([]);
const activeAddons = ref<any[]>([]);
const currentSubscription = ref<any>(null);

const loadAddons = async () => {
  if (needsTenantSelection.value) {
    return; // Don't load if tenant not selected
  }
  
  loading.value = true;
  try {
    const [availableRes, activeRes, subscriptionRes] = await Promise.all([
      api.get('/addons/available'),
      api.get('/addons'),
      api.get('/subscriptions/current').catch(() => ({ data: null })), // Optional, don't fail if no subscription
    ]);
    availableAddons.value = availableRes.data;
    activeAddons.value = activeRes.data;
    currentSubscription.value = subscriptionRes.data;
  } catch (error: any) {
    console.error('Error loading addons:', error);
  } finally {
    loading.value = false;
  }
};


const isAddonActive = (addonId: string) => {
  const now = new Date();
  return activeAddons.value.some(a => {
    if (a.addonId !== addonId) return false;
    // Check if expired
    if (a.expiresAt) {
      const expiresAt = new Date(a.expiresAt);
      return expiresAt > now;
    }
    return true;
  });
};

// Check if addon has limit (can be purchased multiple times)
const hasLimit = (addon: any) => {
  return addon.defaultLimit !== null && addon.defaultLimit !== undefined;
};

// Filter available addons: hide addons without limit that are already active
const filteredAvailableAddons = computed(() => {
  return availableAddons.value.filter(addon => {
    // Addon dengan limit (ADD_OUTLETS, ADD_USERS, ADD_PRODUCTS) selalu ditampilkan
    if (hasLimit(addon)) {
      return true;
    }
    // Addon tanpa limit (BUSINESS_ANALYTICS, EXPORT_REPORTS, RECEIPT_EDITOR)
    // Sembunyikan jika sudah aktif dan belum expired
    // Tampilkan jika expired atau belum pernah dibeli
    if (isAddonActive(addon.id)) {
      return false; // Hide if active and not expired
    }
    return true; // Show if expired or not purchased
  });
});

const getAddonDescription = (activeAddon: any) => {
  // Find matching addon from available addons by addonId or addonType
  const matchedAddon = availableAddons.value.find(
    a => a.id === activeAddon.addonId || a.type === activeAddon.addonType
  );
  return matchedAddon?.description || activeAddon.addonType || 'Tidak ada deskripsi';
};

const subscribeAddon = async (addon: any) => {
  if (needsTenantSelection.value) {
    return; // Don't proceed if tenant not selected
  }
  
  try {
    const response = await api.post('/payment/addon', {
      itemName: addon.name,
      amount: addon.price,
      itemId: addon.id,
      itemType: 'addon',
    });

    if (response.data.success && response.data.paymentUrl) {
      // Redirect to Midtrans payment page
      window.location.href = response.data.paymentUrl;
    } else {
      await showError(response.data.message || 'Gagal membuat pembayaran');
    }
  } catch (error: any) {
    console.error('Error creating payment:', error);
    await showError(error.response?.data?.message || 'Gagal membuat pembayaran');
  }
};

const unsubscribeAddon = async (addonId: string) => {
  const confirmed = await showConfirm('Nonaktifkan addon ini?');
  if (!confirmed) return;
  
  try {
    await api.post(`/addons/unsubscribe/${addonId}`);
    await showSuccess('Addon berhasil dinonaktifkan!');
    await loadAddons();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menonaktifkan addon');
  }
};

const handleTenantChange = (tenantId: string | null) => {
  // Auto-refetch addons when tenant changes
  if (tenantId && !needsTenantSelection.value) {
    loadAddons();
  }
};

// Watch for tenant changes and auto-refetch
watch(() => authStore.currentTenantId, (newTenantId, oldTenantId) => {
  if (newTenantId && newTenantId !== oldTenantId && !needsTenantSelection.value) {
    loadAddons();
  }
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!needsTenantSelection.value) {
    loadAddons();
  }
});
</script>

