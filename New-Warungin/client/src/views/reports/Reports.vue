<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />
    
    <!-- Store Selector -->
    <div class="px-4 sm:px-6 pt-4 sm:pt-6">
      <StoreSelector @store-changed="handleStoreChange" />
    </div>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Laporan</h2>
        <p class="text-sm sm:text-base text-gray-600">Analisis penjualan dan performa toko</p>
      </div>
      <button
        v-if="canExportReports || authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN' || authStore.user?.role === 'SUPERVISOR'"
        @click="showExportModal = true"
        class="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export Laporan</span>
      </button>
    </div>

    <!-- Report Type & Period Filter -->
    <div class="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Tipe Laporan</label>
          <select
            v-model="reportType"
            @change="handleReportTypeChange"
            class="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="sales">Laporan Penjualan</option>
            <option value="financial">Laporan Keuangan</option>
          </select>
        </div>
        <div v-if="authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Jenis Laporan</label>
          <select
            v-model="reportViewType"
            @change="handleReportViewTypeChange"
            class="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="full">Full (Harga Jual + Harga Pokok)</option>
            <option value="revenue">Hanya Harga Jual</option>
            <option value="profit">Dikurangi Harga Pokok (Untung)</option>
          </select>
        </div>
        <div v-if="authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Format Margin</label>
          <select
            v-model="marginDisplayFormat"
            @change="saveMarginFormat"
            class="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="percentage">Persen (%)</option>
            <option value="amount">Jumlah Uang</option>
          </select>
        </div>
        <div class="inline-block">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Periode</label>
          <select
            v-model="period"
            @change="setPeriod(period)"
            class="period-select pr-[15px] pl-2 sm:pl-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="all">Semua</option>
          </select>
        </div>
        <div v-if="period !== 'all'" class="w-auto sm:w-full sm:col-span-2 lg:col-span-1">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Rentang Tanggal</label>
          <div class="flex flex-col sm:flex-row gap-2 w-auto sm:w-full">
            <div class="w-auto sm:flex-1 min-w-[140px]">
              <input
                v-model="dateRange.from"
                type="date"
                @change="handleDateRangeChange"
                class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div class="w-auto sm:flex-1 min-w-[140px]">
              <input
                v-model="dateRange.to"
                type="date"
                @change="handleDateRangeChange"
                class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div v-if="analyticsData && !loading" class="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Analytics</h3>
        <button
          @click="loadAnalytics"
          class="text-sm text-primary-600 hover:text-primary-700 transition"
        >
          Refresh
        </button>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p class="text-xs sm:text-sm text-blue-700 mb-1">Prediksi Bulan Depan</p>
          <p class="text-xl sm:text-2xl font-bold text-blue-900">
            {{ formatCurrency(analyticsData.predictions?.nextMonth || 0) }}
          </p>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p class="text-xs sm:text-sm text-green-700 mb-1">Trend Penjualan</p>
          <p 
            class="text-xl sm:text-2xl font-bold"
            :class="(analyticsData.predictions?.trend || 0) >= 0 ? 'text-green-900' : 'text-red-900'"
          >
            {{ (analyticsData.predictions?.trend || 0) >= 0 ? '+' : '' }}{{ (analyticsData.predictions?.trend || 0).toFixed(2) }}%
          </p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p class="text-xs sm:text-sm text-purple-700 mb-1">Akurasi Prediksi</p>
          <p class="text-xl sm:text-2xl font-bold text-purple-900">
            {{ analyticsData.predictions?.accuracy || 0 }}%
          </p>
        </div>
      </div>
      
      <div v-if="analyticsData.topProducts && analyticsData.topProducts.length > 0" class="mt-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Produk Terlaris</h4>
        <div class="space-y-2">
          <div
            v-for="(product, index) in analyticsData.topProducts.slice(0, 5)"
            :key="product.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-500 w-6">#{{ index + 1 }}</span>
              <span class="text-sm text-gray-900">{{ product.name }}</span>
            </div>
            <span class="text-sm font-semibold text-primary-600">{{ product.sales || 0 }} terjual</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Content -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-gray-600 font-medium">Memuat laporan...</div>
      </div>
    </div>

    <div v-else-if="reportData" class="space-y-4 sm:space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mx-4 sm:mx-6">
        <div
          v-for="(stat, index) in summaryStats"
          :key="index"
          class="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs sm:text-sm font-medium text-gray-600">{{ stat.label }}</p>
            <span class="text-2xl">{{ stat.icon || '📊' }}</span>
          </div>
          <p :class="['text-2xl sm:text-3xl font-bold', stat.color || 'text-gray-900']">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Report Details -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="p-4 sm:p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Detail Laporan</h3>
              <p class="text-xs sm:text-sm text-gray-600 mt-1">
                Periode: {{ getPeriodLabel(period) }} 
                <span v-if="period !== 'all'">
                  ({{ formatDate(dateRange.from) }} - {{ formatDate(dateRange.to) }})
                </span>
              </p>
            </div>
            <button
              v-if="reportType === 'sales' && (authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN')"
              @click="showProductDetails = !showProductDetails"
              class="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              {{ showProductDetails ? 'Sembunyikan' : 'Tampilkan' }} Detail Produk
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="header in reportHeaders"
                  :key="header"
                  class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="(row, index) in reportRows" :key="index">
                <tr class="hover:bg-gray-50">
                  <td
                    v-for="(cell, cellIndex) in row"
                    :key="cellIndex"
                    class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
                  >
                    {{ cell }}
                  </td>
                </tr>
                <!-- Product Details Row (only for sales report and admin tenant) -->
                <tr
                  v-if="showProductDetails && reportType === 'sales' && (authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN') && productDetails[index]"
                  class="bg-gray-50"
                >
                  <td :colspan="reportHeaders.length" class="px-4 sm:px-6 py-3">
                    <div class="space-y-2">
                      <h4 class="text-xs font-semibold text-gray-700 mb-2">Detail Produk:</h4>
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div
                          v-for="product in productDetails[index]"
                          :key="product.id"
                          class="bg-white p-3 rounded border border-gray-200 hover:border-primary-300 cursor-pointer"
                          @click="showProductDetailModal(product)"
                        >
                          <div class="flex justify-between items-start mb-1">
                            <span class="text-xs font-medium text-gray-900">{{ product.name }}</span>
                            <span class="text-xs text-gray-500">x{{ product.quantity }}</span>
                          </div>
                          <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                              <span class="text-gray-600">Harga Jual:</span>
                              <span class="font-medium text-gray-900">{{ formatCurrency(product.sellingPrice) }}</span>
                            </div>
                            <div
                              v-if="product.cost && product.cost > 0"
                              class="flex justify-between"
                            >
                              <span class="text-gray-600">Harga Pokok:</span>
                              <span class="font-medium text-red-600">{{ formatCurrency(product.cost) }}</span>
                            </div>
                            <div
                              v-if="product.cost && product.cost > 0"
                              class="flex justify-between"
                            >
                              <span class="text-gray-600">Untung:</span>
                              <span class="font-medium text-green-600">{{ formatCurrency(product.profit) }}</span>
                            </div>
                            <div
                              v-if="product.cost && product.cost > 0"
                              class="flex justify-between pt-1 border-t border-gray-200"
                            >
                              <span class="text-gray-600">Margin:</span>
                              <span class="font-medium text-green-600">{{ formatProductMargin(product.sellingPrice, product.cost, product.profit) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Detail Modal -->
      <div
        v-if="selectedProductDetail"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="selectedProductDetail = null"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ selectedProductDetail.name }}</h3>
            <button
              @click="selectedProductDetail = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 mb-1">Jumlah Terjual</p>
              <p class="text-lg font-semibold text-gray-900">{{ selectedProductDetail.quantity }} unit</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Harga Jual per Unit</p>
              <p class="text-lg font-semibold text-primary-600">{{ formatCurrency(selectedProductDetail.sellingPrice / selectedProductDetail.quantity) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Harga Jual</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(selectedProductDetail.sellingPrice) }}</p>
            </div>
            <div
              v-if="selectedProductDetail.cost && selectedProductDetail.cost > 0"
              class="border-t pt-4 space-y-3"
            >
              <div>
                <p class="text-sm text-gray-600 mb-1">Harga Pokok per Unit</p>
                <p class="text-lg font-semibold text-red-600">{{ formatCurrency(selectedProductDetail.cost / selectedProductDetail.quantity) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Harga Pokok</p>
                <p class="text-lg font-semibold text-red-600">{{ formatCurrency(selectedProductDetail.cost) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Untung</p>
                <p class="text-xl font-bold text-green-600">{{ formatCurrency(selectedProductDetail.profit) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Margin</p>
                <p class="text-xl font-bold text-green-600">
                  {{ formatProductMargin(
                    selectedProductDetail.sellingPrice,
                    selectedProductDetail.cost,
                    selectedProductDetail.profit
                  ) }}
                </p>
              </div>
            </div>
            <div
              v-else
              class="border-t pt-4"
            >
              <p class="text-sm text-gray-500 italic">Tidak ada data harga pokok untuk produk ini</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="canViewReports || authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500">Memuat laporan...</p>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p class="text-gray-500 font-semibold">Akses Ditolak</p>
      <p class="text-gray-400 text-sm mt-2">Anda tidak memiliki izin untuk melihat laporan</p>
    </div>

    <!-- Export Modal -->
    <ReportExportModal
      :show="showExportModal"
      :report-type="reportType"
      :default-period="period"
      :report-data="reportData"
      :analytics-data="analyticsData"
      @close="showExportModal = false"
      @exported="loadReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelector from '../../components/TenantSelector.vue';
import StoreSelector from '../../components/StoreSelector.vue';
import ReportExportModal from '../../components/ReportExportModal.vue';
import { getPeriodLabel } from '../../utils/export';
import { useNotification } from '../../composables/useNotification';
import { usePermissions } from '../../composables/usePermissions';

const authStore = useAuthStore();
const { showError } = useNotification();
const { canViewReports, canEditReports, canExportReports } = usePermissions();
const loading = ref(false);
const reportData = ref<any>(null);
const analyticsData = ref<any>(null);
const reportType = ref('sales');
const period = ref('all');
const showExportModal = ref(false);
const reportViewType = ref('full'); // 'full', 'revenue', 'profit'
const showProductDetails = ref(false);
const selectedProductDetail = ref<any>(null);
const productDetails = ref<Record<number, any[]>>({});

// Margin display format (percentage or amount)
const marginDisplayFormat = ref<'percentage' | 'amount'>(
  (localStorage.getItem('marginDisplayFormat') as 'percentage' | 'amount') || 'percentage'
);

// Set default date range: 2 weeks back and 2 weeks forward
const now = new Date();
const twoWeeksBack = new Date(now);
twoWeeksBack.setDate(now.getDate() - 14); // 2 weeks back
const twoWeeksForward = new Date(now);
twoWeeksForward.setDate(now.getDate() + 14); // 2 weeks forward

const dateRange = ref({
  from: twoWeeksBack.toISOString().split('T')[0],
  to: twoWeeksForward.toISOString().split('T')[0],
});

const setPeriod = (p: string) => {
  period.value = p;
  handlePeriodChange();
};

// Handle filter changes with proper debouncing
const handleReportTypeChange = () => {
  if (loadReportTimeout) clearTimeout(loadReportTimeout);
  loadReportTimeout = setTimeout(() => {
    loadReport();
  }, 100);
};

const handleReportViewTypeChange = () => {
  if (loadReportTimeout) clearTimeout(loadReportTimeout);
  loadReportTimeout = setTimeout(() => {
    loadReport();
  }, 100);
};

const handlePeriodChange = () => {
  if (loadReportTimeout) clearTimeout(loadReportTimeout);
  loadReportTimeout = setTimeout(() => {
    loadReport();
  }, 100);
};

const handleDateRangeChange = () => {
  if (loadReportTimeout) clearTimeout(loadReportTimeout);
  loadReportTimeout = setTimeout(() => {
    loadReport();
  }, 300);
};

const summaryStats = computed(() => {
  if (!reportData.value) return [];
  
  switch (reportType.value) {
    case 'sales':
      return [
        { label: 'Total Pendapatan', value: formatCurrency(reportData.value.summary?.totalRevenue || 0), icon: '💰', color: 'text-green-600' },
        { label: 'Total Pesanan', value: reportData.value.summary?.totalOrders || 0, icon: '📦', color: 'text-blue-600' },
        { label: 'Rata-rata per Pesanan', value: formatCurrency(reportData.value.summary?.averageOrderValue || 0), icon: '📊', color: 'text-purple-600' },
        { label: 'Total Item Terjual', value: reportData.value.summary?.totalItems || 0, icon: '🛒', color: 'text-orange-600' },
      ];
    case 'financial':
      return [
        { label: 'Pendapatan', value: formatCurrency(reportData.value.revenue || 0), icon: '💵', color: 'text-green-600' },
        { label: 'Biaya Pokok', value: formatCurrency(reportData.value.costOfGoods || 0), icon: '💸', color: 'text-red-600' },
        { label: 'Laba Kotor', value: formatCurrency(reportData.value.grossProfit || 0), icon: '📈', color: 'text-blue-600' },
        { label: 'Margin Laba', value: `${reportData.value.profitMargin?.toFixed(2) || 0}%`, icon: '📊', color: 'text-purple-600' },
      ];
    default:
      return [];
  }
});

const reportHeaders = computed(() => {
  switch (reportType.value) {
    case 'sales':
      return ['Tanggal', 'Total Pendapatan', 'Jumlah Transaksi', 'Rata-rata per Transaksi'];
    case 'financial':
      return ['Tanggal', 'Pendapatan', 'Biaya Pokok', 'Laba Kotor', 'Margin Laba'];
    default:
      return [];
  }
});

const reportRows = computed(() => {
  if (!reportData.value) return [];
  
  switch (reportType.value) {
    case 'sales':
      const salesRows = reportData.value.byDate?.map((item: any, index: number) => {
        // Calculate revenue based on reportViewType
        let revenue = item.revenue || 0;
        let costOfGoods = 0;
        
        // Calculate cost of goods from products if available
        if (item.products && Array.isArray(item.products)) {
          costOfGoods = item.products.reduce((sum: number, p: any) => sum + (p.cost || 0), 0);
        } else if (item.costOfGoods) {
          costOfGoods = item.costOfGoods;
        }
        
        // Apply filter
        if (reportViewType.value === 'revenue') {
          // Hanya harga jual
          revenue = item.revenue || 0;
        } else if (reportViewType.value === 'profit') {
          // Harga jual dikurangi harga pokok (untung)
          revenue = (item.revenue || 0) - costOfGoods;
        } else {
          // Full: tetap revenue asli
          revenue = item.revenue || 0;
        }
        
        // Store product details for this row (sudah diproses di loadReport)
        if (item.products && Array.isArray(item.products)) {
          productDetails.value[index] = item.products;
        }
        
        return [
          formatDate(item.date),
          formatCurrency(revenue),
          item.count || 0,
          formatCurrency(revenue / (item.count || 1)),
        ];
      }) || [];
      return salesRows;
    case 'financial':
      // If byDate exists, use it; otherwise show summary
      if (reportData.value.byDate && reportData.value.byDate.length > 0) {
        return reportData.value.byDate.map((item: any) => {
          let revenue = item.revenue || reportData.value.revenue || 0;
          let costOfGoods = item.costOfGoods || reportData.value.costOfGoods || 0;
          let grossProfit = item.grossProfit || reportData.value.grossProfit || 0;
          
          if (reportViewType.value === 'revenue') {
            costOfGoods = 0;
            grossProfit = revenue;
          } else if (reportViewType.value === 'profit') {
            revenue = grossProfit;
            costOfGoods = 0;
          }
          
          return [
            formatDate(item.date),
            formatCurrency(revenue),
            formatCurrency(costOfGoods),
            formatCurrency(grossProfit),
            `${(item.profitMargin || reportData.value.profitMargin || 0).toFixed(2)}%`,
          ];
        });
      } else {
        // Show summary row if no byDate
        let revenue = reportData.value.revenue || 0;
        let costOfGoods = reportData.value.costOfGoods || 0;
        let grossProfit = reportData.value.grossProfit || 0;
        
        if (reportViewType.value === 'revenue') {
          costOfGoods = 0;
          grossProfit = revenue;
        } else if (reportViewType.value === 'profit') {
          revenue = grossProfit;
          costOfGoods = 0;
        }
        
        return [[
          'Ringkasan',
          formatCurrency(revenue),
          formatCurrency(costOfGoods),
          formatCurrency(grossProfit),
          `${(reportData.value.profitMargin || 0).toFixed(2)}%`,
        ]];
      }
    default:
      return [];
  }
});

const formatProductMargin = (sellingPrice: number, cost: number, profit: number): string => {
  if (marginDisplayFormat.value === 'amount') {
    // Tampilkan margin dalam jumlah uang
    return formatCurrency(profit);
  } else {
    // Tampilkan margin dalam persen
    const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(2) : '0.00';
    return `${margin}%`;
  }
};

const saveMarginFormat = () => {
  localStorage.setItem('marginDisplayFormat', marginDisplayFormat.value);
};

const showProductDetailModal = (product: any) => {
  selectedProductDetail.value = product;
};

const loadReport = async () => {
  loading.value = true;
  productDetails.value = {}; // Reset product details
  try {
    const params: any = {
      reportType: reportType.value,
      period: period.value,
      includeProducts: (authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN') ? 'true' : 'false',
    };
    
    if (period.value !== 'all') {
      params.startDate = dateRange.value.from;
      params.endDate = dateRange.value.to;
    }

    const reportResponse = await api.get('/reports/tenant', { params }).catch(() => ({ data: null }));
    reportData.value = reportResponse.data;
    
    // Process product details if available - pisah 1 per 1 (tidak digabung)
    if (reportData.value?.byDate && Array.isArray(reportData.value.byDate)) {
      reportData.value.byDate.forEach((item: any, index: number) => {
        if (item.orders && Array.isArray(item.orders)) {
          const productsList: any[] = [];
          item.orders.forEach((order: any) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((orderItem: any) => {
                const productId = orderItem.productId || orderItem.product?.id;
                const productName = orderItem.product?.name || 'Unknown';
                const price = Number(orderItem.price || 0);
                const quantity = Number(orderItem.quantity || 0);
                const cost = Number(orderItem.cost || orderItem.product?.cost || 0);
                
                // Setiap item order adalah produk terpisah (1 per 1)
                const sellingPrice = price * quantity;
                const totalCost = cost * quantity;
                const profit = sellingPrice - totalCost;
                const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(2) : '0.00';
                
                productsList.push({
                  id: `${productId}-${order.id}-${orderItem.id || Date.now()}`,
                  productId,
                  name: productName,
                  quantity,
                  sellingPrice,
                  cost: totalCost,
                  profit,
                  margin,
                  orderId: order.id,
                });
              });
            }
          });
          item.products = productsList;
        }
      });
    }
    
    // Don't load analytics here to prevent rate limiting - it's called separately
  } catch (error: any) {
    console.error('Error loading report:', error);
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      await showError('Gagal memuat laporan');
    }
  } finally {
    loading.value = false;
  }
};

const loadAnalytics = async () => {
  try {
    const [predictionsRes, topProductsRes] = await Promise.all([
      api.get('/analytics/predictions').catch(() => ({ data: null })),
      api.get('/analytics/top-products', { params: { limit: 10 } }).catch(() => ({ data: [] })),
    ]);
    
    analyticsData.value = {
      predictions: predictionsRes.data,
      topProducts: topProductsRes.data || [],
    };
  } catch (error: any) {
    console.error('Error loading analytics:', error);
    // Don't show error, just set to null
    analyticsData.value = null;
  }
};

// Debounce function to prevent rate limiting
let loadReportTimeout: ReturnType<typeof setTimeout> | null = null;
let loadAnalyticsTimeout: ReturnType<typeof setTimeout> | null = null;

const handleTenantChange = (tenantId: string | null) => {
  if (tenantId) {
    // Clear existing timeouts
    if (loadReportTimeout) clearTimeout(loadReportTimeout);
    if (loadAnalyticsTimeout) clearTimeout(loadAnalyticsTimeout);
    
    // Debounce API calls
    loadReportTimeout = setTimeout(() => {
      loadReport();
    }, 300);
    
    loadAnalyticsTimeout = setTimeout(() => {
      loadAnalytics();
    }, 500);
  }
};

const handleStoreChange = (storeId: string | null) => {
  // Clear existing timeouts
  if (loadReportTimeout) clearTimeout(loadReportTimeout);
  if (loadAnalyticsTimeout) clearTimeout(loadAnalyticsTimeout);
  
  // Reload report and analytics when store changes
  loadReportTimeout = setTimeout(() => {
    loadReport();
  }, 300);
  
  loadAnalyticsTimeout = setTimeout(() => {
    loadAnalytics();
  }, 500);
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadReport();
  loadAnalytics();
});
</script>

<style scoped>
.period-select {
  width: auto !important;
  min-width: auto !important;
  display: inline-block;
  max-width: fit-content;
}

/* Ensure select width fits content + 15px padding right for all screen sizes */
@media (max-width: 640px) {
  .period-select {
    width: auto !important;
    min-width: auto !important;
  }
}

@media (min-width: 641px) {
  .period-select {
    width: auto !important;
    min-width: auto !important;
  }
}
</style>
