<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center max-w-2xl">
      <div class="mb-6">
        <svg class="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
      <div v-if="reason === 'addon'" class="mb-8">
        <p class="text-lg text-gray-700 mb-4">
          Fitur ini memerlukan addon <strong>{{ getAddonName(addonType) }}</strong> yang aktif.
        </p>
        <p class="text-gray-600 mb-6">
          Silakan berlangganan addon terlebih dahulu untuk mengakses fitur ini.
        </p>
        <router-link
          to="/app/addons"
          class="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Lihat Addon Tersedia
        </router-link>
      </div>
      <div v-else class="mb-8">
        <p class="text-lg text-gray-600 mb-8">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <router-link
          to="/app/dashboard"
          class="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Kembali ke Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

const reason = computed(() => route.query.reason as string);
const addonType = computed(() => route.query.addon as string);

const getAddonName = (type: string | undefined) => {
  const addonNames: Record<string, string> = {
    'BUSINESS_ANALYTICS': 'Business Analytics & Insight',
    'EXPORT_REPORTS': 'Export Laporan',
    'RECEIPT_EDITOR': 'Simple Nota Editor',
    'DELIVERY_MARKETING': 'Delivery & Marketing',
  };
  return addonNames[type || ''] || type || 'Addon';
};
</script>

