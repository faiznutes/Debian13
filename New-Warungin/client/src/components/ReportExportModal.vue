<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Export Laporan</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition p-2"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleExport" class="space-y-4 sm:space-y-6">
          <!-- Export Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Export</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                @click="exportForm.exportType = 'report'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="exportForm.exportType === 'report' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm">Laporan</span>
              </button>
              <button
                type="button"
                @click="exportForm.exportType = 'analytics'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="exportForm.exportType === 'analytics' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="text-sm">Analytics</span>
              </button>
              <button
                type="button"
                @click="exportForm.exportType = 'both'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="exportForm.exportType === 'both' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm">Keduanya</span>
              </button>
            </div>
          </div>

          <!-- Report Type (only show if export type is report or both) -->
          <div v-if="exportForm.exportType === 'report' || exportForm.exportType === 'both'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Laporan</label>
            <select
              v-model="exportForm.reportType"
              required
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="sales">Laporan Penjualan</option>
              <option value="product">Laporan Produk</option>
              <option value="customers">Laporan Pelanggan</option>
              <option value="inventory">Laporan Inventori</option>
              <option value="financial">Laporan Keuangan</option>
            </select>
          </div>

          <!-- Period Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Periode</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                @click="exportForm.period = 'daily'"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border-2 transition"
                :class="exportForm.period === 'daily' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                Harian
              </button>
              <button
                type="button"
                @click="exportForm.period = 'weekly'"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border-2 transition"
                :class="exportForm.period === 'weekly' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                Mingguan
              </button>
              <button
                type="button"
                @click="exportForm.period = 'monthly'"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border-2 transition"
                :class="exportForm.period === 'monthly' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                Bulanan
              </button>
              <button
                type="button"
                @click="exportForm.period = 'all'"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border-2 transition"
                :class="exportForm.period === 'all' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                Semua
              </button>
            </div>
          </div>

          <!-- Date Range (if not 'all') -->
          <div v-if="exportForm.period !== 'all'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                v-model="exportForm.startDate"
                type="date"
                required
                class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                v-model="exportForm.endDate"
                type="date"
                required
                class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <!-- Template Selection (only for PDF) -->
          <div v-if="exportForm.format === 'PDF'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Template</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <button
                type="button"
                @click="exportForm.template = 'minimalist'"
                class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                :class="exportForm.template === 'minimalist' 
                  ? 'border-gray-800 bg-gray-900 text-white font-semibold' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'"
              >
                <span class="font-medium">Minimalis</span>
                <span class="text-xs opacity-75">Sederhana</span>
              </button>
              <button
                type="button"
                @click="exportForm.template = 'modern'"
                class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                :class="exportForm.template === 'modern' 
                  ? 'border-blue-600 bg-blue-600 text-white font-semibold' 
                  : 'border-gray-300 hover:border-blue-300 bg-white'"
              >
                <span class="font-medium">Modern</span>
                <span class="text-xs opacity-75">Kontemporer</span>
              </button>
              <button
                type="button"
                @click="exportForm.template = 'classic'"
                class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                :class="exportForm.template === 'classic' 
                  ? 'border-amber-800 bg-amber-800 text-white font-semibold' 
                  : 'border-gray-300 hover:border-amber-400 bg-white'"
              >
                <span class="font-medium">Klasik</span>
                <span class="text-xs opacity-75">Tradisional</span>
              </button>
              <button
                type="button"
                @click="exportForm.template = 'colorful'"
                class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                :class="exportForm.template === 'colorful' 
                  ? 'border-purple-600 bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold' 
                  : 'border-gray-300 hover:border-purple-300 bg-white'"
              >
                <span class="font-medium">Berwarna</span>
                <span class="text-xs opacity-75">Vibrant</span>
              </button>
              <button
                type="button"
                @click="exportForm.template = 'elegant'"
                class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                :class="exportForm.template === 'elegant' 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold' 
                  : 'border-gray-300 hover:border-emerald-300 bg-white'"
              >
                <span class="font-medium">Elegan</span>
                <span class="text-xs opacity-75">Premium</span>
              </button>
            </div>
          </div>

          <!-- Export Format -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Format Export</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="exportForm.format = 'CSV'"
                :disabled="exportForm.exportType === 'analytics'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="exportForm.format === 'CSV' 
                  ? 'border-green-500 bg-green-50 text-green-700 font-semibold' 
                  : 'border-gray-300 hover:border-green-300'"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm">CSV</span>
                <span class="text-xs text-gray-500">Excel Compatible</span>
                <span v-if="exportForm.exportType === 'analytics'" class="text-xs text-red-500">Tidak tersedia</span>
              </button>
              <button
                type="button"
                @click="exportForm.format = 'PDF'"
                class="px-4 py-3 rounded-lg border-2 transition flex flex-col items-center space-y-2"
                :class="exportForm.format === 'PDF' 
                  ? 'border-red-500 bg-red-50 text-red-700 font-semibold' 
                  : 'border-gray-300 hover:border-red-300'"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span class="text-sm">PDF</span>
                <span class="text-xs text-gray-500">Print Ready</span>
              </button>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-2">Ringkasan Export</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Tipe:</span>
                <span class="font-medium">{{ getReportTypeLabel(exportForm.reportType) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Periode:</span>
                <span class="font-medium">{{ getPeriodLabel(exportForm.period) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Format:</span>
                <span class="font-medium">{{ exportForm.format }}</span>
              </div>
              <div v-if="exportForm.format === 'PDF'" class="flex justify-between">
                <span>Template:</span>
                <span class="font-medium">{{ getTemplateLabel(exportForm.template) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="exporting"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {{ exporting ? 'Mengekspor...' : 'Export' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import api from '../api';
import { exportToCSV, getPeriodLabel } from '../utils/export';
import { generateFlexboxExport } from '../utils/export-templates';
import { useAuthStore } from '../stores/auth';
import { useNotification } from '../composables/useNotification';

const { error: showError, warning: showWarning, success: showSuccess } = useNotification();
const authStore = useAuthStore();

interface Props {
  show: boolean;
  reportType?: string;
  defaultPeriod?: string;
  reportData?: any;
  analyticsData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  reportType: 'sales',
  defaultPeriod: 'all',
});

const emit = defineEmits<{
  close: [];
  exported: [];
}>();

const exporting = ref(false);

const exportForm = ref({
  exportType: 'report' as 'report' | 'analytics' | 'both',
  reportType: props.reportType,
  period: props.defaultPeriod,
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  format: 'PDF' as 'CSV' | 'PDF',
  template: 'modern' as 'minimalist' | 'modern' | 'classic' | 'colorful' | 'elegant',
});

const getReportTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sales: 'Laporan Penjualan',
    product: 'Laporan Produk',
    customers: 'Laporan Pelanggan',
    inventory: 'Laporan Inventori',
    financial: 'Laporan Keuangan',
  };
  return labels[type] || type;
};

const getTemplateLabel = (template: string) => {
  const labels: Record<string, string> = {
    minimalist: 'Minimalis',
    modern: 'Modern',
    classic: 'Klasik',
    colorful: 'Berwarna',
    elegant: 'Elegan',
  };
  return labels[template] || template;
};

const handleExport = async () => {
  exporting.value = true;
  try {
    let reportData = props.reportData;
    let analyticsData = props.analyticsData;
    
    // Fetch data if not provided
    if ((exportForm.value.exportType === 'report' || exportForm.value.exportType === 'both') && !reportData) {
      const response = await api.get('/reports/tenant', {
        params: {
          reportType: exportForm.value.reportType,
          period: exportForm.value.period,
          startDate: exportForm.value.period !== 'all' ? exportForm.value.startDate : undefined,
          endDate: exportForm.value.period !== 'all' ? exportForm.value.endDate : undefined,
        },
      });
      reportData = response.data;
    }
    
    if ((exportForm.value.exportType === 'analytics' || exportForm.value.exportType === 'both') && !analyticsData) {
      const [predictionsRes, topProductsRes] = await Promise.all([
        api.get('/analytics/predictions').catch(() => ({ data: null })),
        api.get('/analytics/top-products', { params: { limit: 10 } }).catch(() => ({ data: [] })),
      ]);
      analyticsData = {
        predictions: predictionsRes.data,
        topProducts: topProductsRes.data || [],
      };
    }
    
    // Use flexbox export for PDF
    if (exportForm.value.format === 'PDF') {
      await generateFlexboxExport({
        type: exportForm.value.exportType,
        reportData,
        analyticsData,
        reportType: exportForm.value.reportType,
        startDate: exportForm.value.startDate,
        endDate: exportForm.value.endDate,
        tenantName: authStore.user?.tenantName || 'Tenant',
        template: exportForm.value.template,
      });
      await showSuccess('Export berhasil! PDF telah didownload.');
      emit('exported');
      emit('close');
      return;
    }
    
    // CSV export (only for report type, not analytics)
    if (exportForm.value.format === 'CSV') {
      if (exportForm.value.exportType === 'analytics') {
        await showWarning('Export CSV hanya tersedia untuk laporan. Gunakan PDF untuk export analytics.');
        return;
      }
      
      // Format data based on report type
      let exportData: any[] = [];
      let headers: string[] = [];

    switch (exportForm.value.reportType) {
      case 'sales':
        exportData = reportData.byDate?.map((item: any) => ({
          Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
          'Total Pendapatan': item.revenue,
          'Jumlah Transaksi': item.count,
          'Rata-rata': item.revenue / (item.count || 1),
        })) || [];
        headers = ['Tanggal', 'Total Pendapatan', 'Jumlah Transaksi', 'Rata-rata'];
        break;
      case 'product':
        exportData = reportData.products?.map((item: any) => ({
          'Nama Produk': item.product.name,
          'Kategori': item.product.category || '-',
          'Jumlah Terjual': item.totalSold,
          'Total Pendapatan': item.totalRevenue,
          'Stok Saat Ini': item.stockLevel,
          'Status Stok': item.isLowStock ? 'Rendah' : 'Normal',
        })) || [];
        headers = ['Nama Produk', 'Kategori', 'Jumlah Terjual', 'Total Pendapatan', 'Stok Saat Ini', 'Status Stok'];
        break;
      case 'customers':
        exportData = [
          ...(reportData.customers?.map((item: any) => ({
            'Nama Pelanggan': item.customer.name,
            'Email': item.customer.email || '-',
            'Telepon': item.customer.phone || '-',
            'Jumlah Transaksi': item.totalOrders,
            'Total Belanja': item.totalSpent,
            'Rata-rata Belanja': item.averageOrder,
          })) || []),
          ...(reportData.members?.map((item: any) => ({
            'Nama Pelanggan': item.member.name,
            'Email': item.member.email || '-',
            'Telepon': item.member.phone || '-',
            'Jumlah Transaksi': item.totalOrders,
            'Total Belanja': item.totalSpent,
            'Rata-rata Belanja': item.averageOrder,
          })) || []),
        ];
        headers = ['Nama Pelanggan', 'Email', 'Telepon', 'Jumlah Transaksi', 'Total Belanja', 'Rata-rata Belanja'];
        break;
      case 'inventory':
        exportData = reportData.inventory?.map((item: any) => ({
          'Nama Produk': item.product.name,
          'Kategori': item.product.category || '-',
          'Stok Saat Ini': item.currentStock,
          'Stok Minimum': item.minStock,
          'Nilai Stok': item.stockValue,
          'Total Terjual': item.totalSold,
          'Status': item.isLowStock ? 'Stok Rendah' : 'Normal',
        })) || [];
        headers = ['Nama Produk', 'Kategori', 'Stok Saat Ini', 'Stok Minimum', 'Nilai Stok', 'Total Terjual', 'Status'];
        break;
      case 'financial':
        exportData = reportData.byDate?.map((item: any) => ({
          Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
          Pendapatan: reportData.revenue || 0,
          'Biaya Pokok': reportData.costOfGoods || 0,
          'Laba Kotor': reportData.grossProfit || 0,
          'Margin Laba': `${reportData.profitMargin?.toFixed(2) || 0}%`,
        })) || [];
        headers = ['Tanggal', 'Pendapatan', 'Biaya Pokok', 'Laba Kotor', 'Margin Laba'];
        break;
    }

      if (exportData.length === 0) {
        await showWarning('Tidak ada data untuk diekspor');
        return;
      }

      const filename = `laporan-${exportForm.value.reportType}-${exportForm.value.period}-${new Date().toISOString().split('T')[0]}`;

      exportToCSV(exportData, filename, headers);
      
      await showSuccess('Export berhasil!');
      emit('exported');
      emit('close');
    }
  } catch (error: any) {
    console.error('Error exporting report:', error);
    await showError(error.response?.data?.message || 'Gagal mengekspor laporan');
  } finally {
    exporting.value = false;
  }
};

watch(() => exportForm.value.exportType, (newType) => {
  // Auto-select PDF if analytics is selected (CSV not available)
  if (newType === 'analytics' && exportForm.value.format === 'CSV') {
    exportForm.value.format = 'PDF';
  }
});

watch(() => props.show, (newShow) => {
  if (newShow) {
    exportForm.value.reportType = props.reportType;
    exportForm.value.period = props.defaultPeriod;
  }
});
</script>

