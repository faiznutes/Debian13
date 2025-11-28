<template>
  <div class="flex flex-col h-full">
    <div class="mb-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Dashboard Tenant</h3>
        <p class="text-sm text-gray-600">Ringkasan performa tenant</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12 px-4 sm:px-6">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="flex flex-col gap-6 px-4 sm:px-6">
      <!-- Overview Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Penjualan</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.totalSales) }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Pesanan</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalOrders }}</p>
            </div>
            <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Produk</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalProducts }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Pelanggan</p>
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

      <!-- Today Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p class="text-sm text-gray-600 mb-2">Penjualan Hari Ini</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.todaySales) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p class="text-sm text-gray-600 mb-2">Pesanan Hari Ini</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.todayOrders }}</p>
        </div>
      </div>

      <!-- Low Stock Alert -->
      <div v-if="stats.lowStockProducts > 0" class="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-yellow-900">Peringatan Stok Rendah</h3>
          </div>
        </div>
        <p class="text-yellow-800 mb-4 font-medium">
          Ada <strong class="text-yellow-900 text-xl">{{ stats.lowStockProducts }}</strong> produk dengan stok menipis yang perlu segera diisi ulang
        </p>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Pesanan Terkini</h3>
          <div class="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
        </div>
        <div v-if="recentOrders.length === 0" class="text-center py-8 text-gray-500">
          Belum ada pesanan
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="order in recentOrders.slice(0, 5)"
            :key="order.id"
            class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-primary-50 hover:to-primary-50 transition border border-gray-100 hover:border-primary-200"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ order.orderNumber }}</p>
              <p class="text-sm text-gray-600">{{ formatCurrency(Number(order.total)) }}</p>
            </div>
            <span
              class="px-3 py-1 text-xs font-semibold rounded-full"
              :class="getStatusClass(order.status)"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../../../api';
import { formatCurrency } from '../../../utils/formatters';
import { useNotification } from '../../../composables/useNotification';

const { error: showError } = useNotification();

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const stats = ref({
  totalSales: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalCustomers: 0,
  todaySales: 0,
  todayOrders: 0,
  lowStockProducts: 0,
});
const recentOrders = ref<any[]>([]);

const loadDashboard = async () => {
  if (!props.tenantId) return;
  
  loading.value = true;
  try {
    // Load dashboard stats
    const [statsRes, ordersRes, productsRes, customersRes] = await Promise.all([
      api.get('/dashboard/stats', { params: { tenantId: props.tenantId } }),
      api.get('/orders', { params: { limit: 100 } }),
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
    stats.value.lowStockProducts = products.filter((p: any) => p.stock <= (p.minStock || 0)).length;

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: any) => o.createdAt?.startsWith(today));
    stats.value.todayOrders = todayOrders.length;
    stats.value.todaySales = todayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

    // Recent orders (last 5)
    recentOrders.value = orders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  } catch (error: any) {
    console.error('Error loading dashboard:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Gagal memuat dashboard';
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  };
  return labels[status] || status;
};

watch(() => props.tenantId, (newTenantId) => {
  if (newTenantId) {
    localStorage.setItem('selectedTenantId', newTenantId);
    setTimeout(() => {
      loadDashboard();
    }, 100);
  }
}, { immediate: true });
</script>

