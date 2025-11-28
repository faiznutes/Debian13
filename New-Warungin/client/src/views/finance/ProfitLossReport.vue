<template>
  <div class="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Laba Rugi</h2>
        <p class="text-sm sm:text-base text-gray-600">Analisis keuangan bisnis Anda secara detail</p>
      </div>
      <div class="w-full sm:w-auto flex items-center gap-2 sm:gap-4">
        <input
          type="date"
          v-model="startDate"
          @change="loadProfitLoss"
          class="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium shadow-sm"
        />
        <span class="text-gray-600 font-medium">s/d</span>
        <input
          type="date"
          v-model="endDate"
          @change="loadProfitLoss"
          class="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium shadow-sm"
        />
        <button
          @click="exportReport"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div class="text-gray-600 font-medium">Memuat laporan...</div>
    </div>

    <div v-else-if="error" class="px-4 sm:px-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <p class="text-red-800 font-medium">{{ error }}</p>
            <router-link 
              v-if="error.includes('addon')" 
              to="/app/addons" 
              class="text-red-600 hover:text-red-800 text-sm underline mt-2 inline-block"
            >
              Berlangganan Business Analytics & Insight
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="profitLoss" class="px-4 sm:px-6 pb-6 space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <p class="text-sm font-semibold text-green-100 mb-2">Revenue</p>
          <p class="text-3xl font-bold">{{ formatCurrency(profitLoss.revenue) }}</p>
        </div>
        <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <p class="text-sm font-semibold text-red-100 mb-2">COGS</p>
          <p class="text-3xl font-bold">{{ formatCurrency(profitLoss.cogs) }}</p>
        </div>
        <div class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <p class="text-sm font-semibold text-blue-100 mb-2">Gross Profit</p>
          <p class="text-3xl font-bold">{{ formatCurrency(profitLoss.grossProfit) }}</p>
          <p class="text-sm text-blue-100 mt-2">Margin: {{ profitLoss.grossProfitMargin.toFixed(1) }}%</p>
        </div>
        <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <p class="text-sm font-semibold text-purple-100 mb-2">Net Profit</p>
          <p class="text-3xl font-bold">{{ formatCurrency(profitLoss.netProfit) }}</p>
          <p class="text-sm text-purple-100 mt-2">Margin: {{ profitLoss.netProfitMargin.toFixed(1) }}%</p>
        </div>
      </div>

      <!-- Detailed Report -->
      <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Detail Laporan Laba Rugi</h3>
        
        <div class="space-y-4">
          <!-- Revenue Section -->
          <div class="border-b pb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-lg font-semibold text-gray-900">Revenue</span>
              <span class="text-lg font-bold text-gray-900">{{ formatCurrency(profitLoss.revenue) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm text-gray-600 ml-4">
              <span>Penjualan</span>
              <span>{{ formatCurrency(profitLoss.revenue) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm text-gray-600 ml-4">
              <span>Diskon</span>
              <span class="text-red-600">-{{ formatCurrency(profitLoss.discount) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-semibold text-gray-700 mt-2 pt-2 border-t">
              <span>Net Revenue</span>
              <span>{{ formatCurrency(profitLoss.revenue - profitLoss.discount) }}</span>
            </div>
          </div>

          <!-- COGS Section -->
          <div class="border-b pb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-lg font-semibold text-gray-900">Cost of Goods Sold (COGS)</span>
              <span class="text-lg font-bold text-red-600">{{ formatCurrency(profitLoss.cogs) }}</span>
            </div>
            <div class="text-sm text-gray-600 ml-4">
              <p>Biaya produk yang terjual</p>
            </div>
          </div>

          <!-- Gross Profit -->
          <div class="border-b pb-4 bg-green-50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-lg font-bold text-gray-900">Gross Profit</span>
              <span class="text-lg font-bold text-green-600">{{ formatCurrency(profitLoss.grossProfit) }}</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
              Gross Profit Margin: <span class="font-semibold">{{ profitLoss.grossProfitMargin.toFixed(2) }}%</span>
            </div>
          </div>

          <!-- Operating Expenses -->
          <div class="border-b pb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-lg font-semibold text-gray-900">Operating Expenses</span>
              <span class="text-lg font-bold text-orange-600">{{ formatCurrency(profitLoss.operatingExpenses) }}</span>
            </div>
            <div class="text-sm text-gray-600 ml-4">
              <p>Biaya operasional (estimasi 15% dari revenue)</p>
            </div>
          </div>

          <!-- Net Profit -->
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xl font-bold text-gray-900">Net Profit</span>
              <span 
                :class="profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-2xl font-bold"
              >
                {{ formatCurrency(profitLoss.netProfit) }}
              </span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
              Net Profit Margin: 
              <span 
                :class="profitLoss.netProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'"
                class="font-semibold"
              >
                {{ profitLoss.netProfitMargin.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useNotification } from '../../composables/useNotification';

const { error: showError, success: showSuccess } = useNotification();

interface ProfitLoss {
  revenue: number;
  discount: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
}

const loading = ref(false);
const error = ref<string | null>(null);
const profitLoss = ref<ProfitLoss | null>(null);

// Set default date range to current month
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const startDate = ref(firstDay.toISOString().split('T')[0]);
const endDate = ref(lastDay.toISOString().split('T')[0]);

const loadProfitLoss = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/finance/profit-loss', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    profitLoss.value = response.data;
  } catch (err: any) {
    if (err.response?.status === 403) {
      error.value = 'Business Analytics & Insight addon diperlukan untuk mengakses fitur ini';
    } else {
      error.value = err.response?.data?.message || 'Gagal memuat laporan laba rugi';
      await showError(error.value);
    }
  } finally {
    loading.value = false;
  }
};

const exportReport = async () => {
  try {
    const response = await api.get('/finance/profit-loss', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        export: true,
      },
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-laba-rugi-${startDate.value}-${endDate.value}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    await showSuccess('Laporan berhasil diekspor');
  } catch (err: any) {
    await showError(err.response?.data?.message || 'Gagal mengekspor laporan');
  }
};

onMounted(() => {
  loadProfitLoss();
});
</script>

