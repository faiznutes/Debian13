<template>
  <div class="flex flex-col h-full">
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Laporan Tenant</h3>
        <button
          @click="showExportModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Laporan</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Penjualan</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.totalSales) }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Pesanan</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalOrders }}</p>
            </div>
            <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Produk</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalProducts }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Pelanggan</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalCustomers }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm p-4 sm:p-5">
      <h4 class="text-md font-semibold text-gray-900 mb-4">Ringkasan Laporan</h4>
      <div class="space-y-4">
        <div class="border-l-4 border-blue-500 pl-4">
          <p class="text-sm text-gray-600">Penjualan Hari Ini</p>
          <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(stats.todaySales) }}</p>
        </div>
        <div class="border-l-4 border-green-500 pl-4">
          <p class="text-sm text-gray-600">Pesanan Hari Ini</p>
          <p class="text-lg font-semibold text-gray-900">{{ stats.todayOrders }}</p>
        </div>
        <div class="border-l-4 border-purple-500 pl-4">
          <p class="text-sm text-gray-600">Produk Aktif</p>
          <p class="text-lg font-semibold text-gray-900">{{ stats.activeProducts }}</p>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <TenantReportExportModal
      :show="showExportModal"
      :tenants="tenants"
      :current-tenant-id="props.tenantId"
      :stats="stats"
      @close="showExportModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../../../api';
import { formatCurrency } from '../../../utils/formatters';
import { useNotification } from '../../../composables/useNotification';
import TenantReportExportModal from '../../../components/TenantReportExportModal.vue';

const { error: showError } = useNotification();

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();

const showExportModal = ref(false);
const tenants = ref<Array<{ id: string; name: string }>>([]);
const loading = ref(false);
const stats = ref({
  totalSales: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalCustomers: 0,
  todaySales: 0,
  todayOrders: 0,
  activeProducts: 0,
});

const loadTenants = async () => {
  try {
    const response = await api.get('/tenants');
    tenants.value = (response.data.data || response.data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
    }));
  } catch (error) {
    console.error('Error loading tenants:', error);
  }
};

const loadReports = async () => {
  if (!props.tenantId) return;
  
  loading.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    const [ordersRes, productsRes, customersRes] = await Promise.all([
      api.get('/orders'),
      api.get('/products'),
      api.get('/customers'),
    ]);

    const orders = ordersRes.data.data || ordersRes.data || [];
    const products = productsRes.data.data || productsRes.data || [];
    const customers = customersRes.data.data || customersRes.data || [];

    stats.value.totalOrders = orders.length;
    stats.value.totalSales = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
    stats.value.totalProducts = products.length;
    stats.value.totalCustomers = customers.length;
    stats.value.activeProducts = products.filter((p: any) => p.isActive).length;

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: any) => o.createdAt?.startsWith(today));
    stats.value.todayOrders = todayOrders.length;
    stats.value.todaySales = todayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
  } catch (error: any) {
    console.error('Error loading reports:', error);
    await showError('Gagal memuat laporan');
  } finally {
    loading.value = false;
  }
};

watch(() => props.tenantId, (newTenantId) => {
  if (newTenantId) {
    // Ensure tenantId is set in localStorage for API interceptor
    localStorage.setItem('selectedTenantId', newTenantId);
    // Small delay to ensure localStorage is updated
    setTimeout(() => {
      loadReports();
    }, 100);
  }
}, { immediate: true });

onMounted(() => {
  loadTenants();
});
</script>

