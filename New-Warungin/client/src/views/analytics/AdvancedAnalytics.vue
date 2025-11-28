<template>
  <div class="flex flex-col h-full">
    <!-- Error Message if Addon Not Active -->
    <div v-if="addonError" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <p class="text-red-800 font-medium">{{ addonError }}</p>
          <router-link to="/app/addons" class="text-red-600 hover:text-red-800 text-sm underline mt-1 inline-block">
            Berlangganan Business Analytics & Insight
          </router-link>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <p class="text-gray-600">Prediksi penjualan, forecasting, dan custom reports</p>
      </div>
      <button
        v-if="!addonError"
        @click="showCustomReportModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Buat Custom Report
      </button>
    </div>

    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Prediksi Penjualan</span>
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(predictions.nextMonth) }}</div>
        <div class="text-sm text-gray-500 mt-1">Bulan depan</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Trend Penjualan</span>
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900" :class="predictions.trend > 0 ? 'text-green-600' : 'text-red-600'">
          {{ predictions.trend > 0 ? '+' : '' }}{{ predictions.trend }}%
        </div>
        <div class="text-sm text-gray-500 mt-1">vs bulan lalu</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Produk Terlaris</span>
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ topProducts.length }}</div>
        <div class="text-sm text-gray-500 mt-1">Top 10 produk</div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Forecast Accuracy</span>
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ predictions.accuracy }}%</div>
        <div class="text-sm text-gray-500 mt-1">Akurasi prediksi</div>
        <div class="mt-3">
          <select 
            v-model="forecastMethod" 
            @change="loadAnalytics"
            class="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="moving_average">Moving Average</option>
            <option value="linear_regression">Linear Regression</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Sales Forecast Chart -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Sales Forecast (3 Bulan)</h3>
        <div class="h-64 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Chart akan ditampilkan di sini</p>
          </div>
        </div>
      </div>

      <!-- Top Products Chart -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top 10 Produk Terlaris</h3>
        <div class="space-y-3">
          <div
            v-for="(product, index) in topProducts"
            :key="product.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3 flex-1">
              <span class="text-sm font-semibold text-gray-400 w-6">{{ index + 1 }}</span>
              <span class="text-sm text-gray-900 flex-1 truncate">{{ product.name }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-24 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full"
                  :style="{ width: `${(product.sales / topProducts[0].sales) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900 w-16 text-right">{{ product.sales }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Reports -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Custom Reports</h3>
      <div v-if="customReports.length === 0" class="text-center py-8 text-gray-500">
        Belum ada custom report
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="report in customReports"
          :key="report.id"
          class="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
        >
          <h4 class="font-semibold text-gray-900 mb-2">{{ report.name }}</h4>
          <p class="text-sm text-gray-600 mb-3">{{ report.description }}</p>
          <div class="flex space-x-2">
            <button
              @click="viewReport(report)"
              class="flex-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            >
              Lihat
            </button>
            <button
              @click="exportReport(report)"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Report Modal -->
    <Teleport to="body">
      <div
        v-if="showCustomReportModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showCustomReportModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Buat Custom Report</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Report</label>
              <input
                v-model="reportForm.name"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Contoh: Laporan Penjualan Harian"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Data</label>
              <select
                v-model="reportForm.dataType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SALES">Penjualan</option>
                <option value="PRODUCTS">Produk</option>
                <option value="CUSTOMERS">Customer</option>
                <option value="INVENTORY">Inventory</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Metrik</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input v-model="reportForm.metrics" type="checkbox" value="REVENUE" class="mr-2" />
                  <span class="text-sm text-gray-700">Revenue</span>
                </label>
                <label class="flex items-center">
                  <input v-model="reportForm.metrics" type="checkbox" value="QUANTITY" class="mr-2" />
                  <span class="text-sm text-gray-700">Quantity</span>
                </label>
                <label class="flex items-center">
                  <input v-model="reportForm.metrics" type="checkbox" value="PROFIT" class="mr-2" />
                  <span class="text-sm text-gray-700">Profit</span>
                </label>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
                <input
                  v-model="reportForm.startDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
                <input
                  v-model="reportForm.endDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div class="flex space-x-3">
              <button
                @click="showCustomReportModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="saveCustomReport"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Report Detail Modal -->
    <AnalyticsReportDetailModal
      :show="showReportDetailModal"
      :report="viewingReport"
      @close="showReportDetailModal = false; viewingReport = null"
      @export="exportReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import AnalyticsReportDetailModal from '../../components/AnalyticsReportDetailModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError, info: showInfo } = useNotification();

interface Prediction {
  nextMonth: number;
  trend: number;
  accuracy: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
}

interface CustomReport {
  id: string;
  name: string;
  description?: string;
  dataType: string;
  metrics: string[];
  startDate?: string;
  endDate?: string;
}

const predictions = ref<Prediction>({
  nextMonth: 0,
  trend: 0,
  accuracy: 0,
});

const topProducts = ref<TopProduct[]>([]);
const customReports = ref<CustomReport[]>([]);
const loading = ref(false);
const addonError = ref<string | null>(null);
const showCustomReportModal = ref(false);
const showReportDetailModal = ref(false);
const viewingReport = ref<CustomReport | null>(null);

const reportForm = ref({
  name: '',
  dataType: 'SALES',
  metrics: [] as string[],
  startDate: '',
  endDate: '',
});

const forecastMethod = ref<'moving_average' | 'linear_regression'>('moving_average');

const loadAnalytics = async () => {
  if (needsTenantSelection.value) return;

  loading.value = true;
  try {
    const [predictionsRes, productsRes, reportsRes] = await Promise.all([
      api.get('/analytics/predictions', { 
        params: { method: forecastMethod.value } 
      }).catch(() => ({ data: { nextMonth: 0, trend: 0, accuracy: 85 } })),
      api.get('/analytics/top-products', { params: { limit: 10 } }).catch(() => ({ data: [] })),
      api.get('/analytics/custom-reports').catch(() => ({ data: { data: [] } })),
    ]);

    predictions.value = predictionsRes.data;
    topProducts.value = productsRes.data || [];
    customReports.value = reportsRes.data?.data || reportsRes.data || [];
  } catch (error: any) {
    console.error('Error loading analytics:', error);
    if (error.response?.status === 403) {
      addonError.value = 'Business Analytics & Insight addon diperlukan untuk mengakses fitur ini';
      await showError('Business Analytics & Insight addon diperlukan untuk mengakses fitur ini');
    } else {
      addonError.value = null;
    }
  } finally {
    loading.value = false;
  }
};

const viewReport = (report: CustomReport) => {
  viewingReport.value = report;
  showReportDetailModal.value = true;
};

const exportReport = async (report: CustomReport) => {
  try {
    const response = await api.get(`/analytics/custom-reports/${report.id}/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.name}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error('Error exporting report:', error);
    await showError('Gagal mengekspor report');
  }
};

const saveCustomReport = async () => {
  try {
    await api.post('/analytics/custom-reports', reportForm.value);
    await showSuccess('Custom report berhasil dibuat');
    showCustomReportModal.value = false;
    reportForm.value = {
      name: '',
      dataType: 'SALES',
      metrics: [],
      startDate: '',
      endDate: '',
    };
    await loadAnalytics();
  } catch (error: any) {
    console.error('Error saving custom report:', error);
    await showError(error.response?.data?.message || 'Gagal membuat custom report');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadAnalytics();
});
</script>

