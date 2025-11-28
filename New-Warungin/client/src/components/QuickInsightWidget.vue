<template>
  <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-900">Quick Insight</h3>
      <div class="flex items-center gap-3">
        <!-- Period Selector (only for Admin Tenant) -->
        <select
          v-if="userRole === 'ADMIN_TENANT'"
          v-model="selectedPeriod"
          @change="loadInsight"
          class="text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
        >
          <option value="daily">Hari</option>
          <option value="weekly">Minggu</option>
          <option value="monthly">Bulan</option>
        </select>
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="text-center py-4 text-red-600 text-sm">
      {{ error }}
    </div>

    <div v-else-if="insight" class="space-y-4">
      <!-- Today's Summary -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <p class="text-xs text-gray-600 mb-1">{{ periodLabel }} Transaksi</p>
          <p class="text-2xl font-bold text-gray-900">{{ insight.today.transactions }}</p>
          <div class="flex items-center mt-2">
            <span 
              :class="insight.comparison.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'"
              class="text-xs font-semibold flex items-center"
            >
              <svg 
                v-if="insight.comparison.transactionsChange >= 0" 
                class="w-3 h-3 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <svg 
                v-else 
                class="w-3 h-3 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {{ Math.abs(insight.comparison.transactionsChange).toFixed(1) }}%
            </span>
            <span class="text-xs text-gray-500 ml-1">vs {{ previousPeriodLabel }}</span>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
          <p class="text-xs text-gray-600 mb-1">{{ periodLabel }} Pendapatan</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(insight.today.revenue) }}</p>
          <div class="flex items-center mt-2">
            <span 
              :class="insight.comparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'"
              class="text-xs font-semibold flex items-center"
            >
              <svg 
                v-if="insight.comparison.revenueChange >= 0" 
                class="w-3 h-3 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <svg 
                v-else 
                class="w-3 h-3 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {{ Math.abs(insight.comparison.revenueChange).toFixed(1) }}%
            </span>
            <span class="text-xs text-gray-500 ml-1">vs {{ previousPeriodLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="border-t pt-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">Produk Terlaris {{ periodLabel }}</p>
        <div v-if="insight.today.topProducts.length === 0" class="text-center py-4 text-gray-500 text-sm">
          Belum ada produk terjual {{ periodLabel.toLowerCase() }}
        </div>
        <div v-else class="space-y-2">
          <div 
            v-for="(product, index) in insight.today.topProducts.slice(0, 3)" 
            :key="product.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center flex-1 min-w-0">
              <span class="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                {{ index + 1 }}
              </span>
              <span class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</span>
            </div>
            <div class="flex items-center gap-2 ml-2">
              <span class="text-xs text-gray-600">{{ product.sales }}x</span>
              <span class="text-xs font-semibold text-purple-600">{{ formatCurrency(product.revenue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const userRole = computed(() => authStore.user?.role || '');

interface QuickInsight {
  today: {
    transactions: number;
    revenue: number;
    averageTransaction: number;
    topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
  };
  yesterday: {
    transactions: number;
    revenue: number;
    averageTransaction: number;
  };
  comparison: {
    transactionsChange: number;
    revenueChange: number;
    averageTransactionChange: number;
  };
  trends: {
    transactionsTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
  };
}

const insight = ref<QuickInsight | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
// Default period: monthly for Super Admin, daily for others
const getDefaultPeriod = (): 'daily' | 'weekly' | 'monthly' => {
  return userRole.value === 'SUPER_ADMIN' ? 'monthly' : 'daily';
};
const selectedPeriod = ref<'daily' | 'weekly' | 'monthly'>(getDefaultPeriod());

const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case 'daily': return 'Hari Ini';
    case 'weekly': return 'Minggu Ini';
    case 'monthly': return 'Bulan Ini';
    default: return 'Hari Ini';
  }
});

const previousPeriodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case 'daily': return 'kemarin';
    case 'weekly': return 'minggu lalu';
    case 'monthly': return 'bulan lalu';
    default: return 'kemarin';
  }
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const loadInsight = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/quick-insight', {
      params: { period: selectedPeriod.value },
    });
    insight.value = response.data;
  } catch (err: any) {
    if (err.response?.status === 403) {
      // Addon not active, don't show error
      error.value = null;
      insight.value = null;
    } else {
      error.value = err.response?.data?.message || 'Gagal memuat Quick Insight';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInsight();
});
</script>

