<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Export Laporan Global</h3>
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
                @click="exportForm.period = 'custom'"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border-2 transition"
                :class="exportForm.period === 'custom' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' 
                  : 'border-gray-300 hover:border-primary-300'"
              >
                Kustom
              </button>
            </div>
          </div>

          <!-- Date Range (if custom) -->
          <div v-if="exportForm.period === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <!-- Template Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Template</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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

          <!-- Summary -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-2">Ringkasan Export</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Periode:</span>
                <span class="font-medium">{{ getPeriodLabel(exportForm.period) }}</span>
              </div>
              <div v-if="exportForm.period === 'custom'" class="flex justify-between">
                <span>Tanggal:</span>
                <span class="font-medium">{{ exportForm.startDate }} - {{ exportForm.endDate }}</span>
              </div>
              <div class="flex justify-between">
                <span>Format:</span>
                <span class="font-medium">PDF</span>
              </div>
              <div class="flex justify-between">
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
              {{ exporting ? 'Mengekspor...' : 'Export PDF' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import api from '../api';
import { generateFlexboxExport } from '../utils/export-templates';
import { useNotification } from '../composables/useNotification';
import { getPeriodLabel } from '../utils/export';

const { error: showError, success: showSuccess } = useNotification();

interface Props {
  show: boolean;
  defaultStartDate?: string;
  defaultEndDate?: string;
  reportData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  defaultStartDate: '',
  defaultEndDate: '',
});

const emit = defineEmits<{
  close: [];
  exported: [];
}>();

const exporting = ref(false);

const exportForm = ref({
  period: 'custom' as 'daily' | 'weekly' | 'monthly' | 'custom',
  startDate: props.defaultStartDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: props.defaultEndDate || new Date().toISOString().split('T')[0],
  template: 'modern' as 'minimalist' | 'modern' | 'classic' | 'colorful' | 'elegant',
});

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

const computedDates = computed(() => {
  const now = new Date();
  let startDate = '';
  let endDate = now.toISOString().split('T')[0];

  switch (exportForm.value.period) {
    case 'daily':
      startDate = endDate;
      break;
    case 'weekly':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'monthly':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    case 'custom':
      startDate = exportForm.value.startDate;
      endDate = exportForm.value.endDate;
      break;
  }

  return { startDate, endDate };
});

const handleExport = async () => {
  exporting.value = true;
  try {
    let reportData = props.reportData;
    
    // Fetch data if not provided
    if (!reportData) {
      const { startDate, endDate } = computedDates.value;
      const response = await api.get('/reports/global', {
        params: {
          startDate,
          endDate,
        },
      });
      reportData = response.data;
    }
    
    const { startDate, endDate } = computedDates.value;
    
    // Always use PDF export
    await generateFlexboxExport({
      type: 'report',
      reportData,
      reportType: 'global',
      startDate,
      endDate,
      tenantName: 'Laporan Global',
      template: exportForm.value.template,
      isGlobal: true,
    });
    
    await showSuccess('Export berhasil! PDF telah didownload.');
    emit('exported');
    emit('close');
  } catch (error: any) {
    console.error('Error exporting global report:', error);
    await showError(error.response?.data?.message || 'Gagal mengekspor laporan global');
  } finally {
    exporting.value = false;
  }
};

watch(() => exportForm.value.period, (newPeriod) => {
  if (newPeriod !== 'custom') {
    const { startDate, endDate } = computedDates.value;
    exportForm.value.startDate = startDate;
    exportForm.value.endDate = endDate;
  }
});

watch(() => props.show, (newShow) => {
  if (newShow) {
    exportForm.value.startDate = props.defaultStartDate || exportForm.value.startDate;
    exportForm.value.endDate = props.defaultEndDate || exportForm.value.endDate;
  }
});
</script>

