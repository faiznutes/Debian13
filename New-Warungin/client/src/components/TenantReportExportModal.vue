<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900">Export Laporan Tenant</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Store Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Store <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="exportForm.storeSelection"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="current">Store Saat Ini</option>
                  <option value="all">Semua Store</option>
                  <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                    {{ tenant.name }}
                  </option>
                </select>
              </div>

              <!-- Template Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Pilih Template <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="template in templates"
                    :key="template.id"
                    @click="exportForm.template = template.id"
                    class="border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md"
                    :class="exportForm.template === template.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-semibold text-gray-900">{{ template.name }}</h4>
                      <div
                        v-if="exportForm.template === template.id"
                        class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                      >
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p class="text-xs text-gray-600">{{ template.description }}</p>
                    <div class="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span v-for="tag in template.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 rounded">
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                  <input
                    v-model="exportForm.startDate"
                    type="date"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
                  <input
                    v-model="exportForm.endDate"
                    type="date"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  @click="$emit('close')"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  @click="handleExport"
                  :disabled="!exportForm.template || !exportForm.storeSelection || exporting"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ exporting ? 'Mengekspor...' : 'Export PDF' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useNotification } from '../composables/useNotification';
import { generateReportPDF } from '../utils/report-templates';

interface Tenant {
  id: string;
  name: string;
}

interface Props {
  show: boolean;
  tenants: Tenant[];
  currentTenantId?: string;
  stats?: any;
}

const props = withDefaults(defineProps<Props>(), {
  currentTenantId: '',
  stats: () => ({}),
});

const emit = defineEmits<{
  close: [];
}>();

const { error: showError, success: showSuccess } = useNotification();

const exportForm = ref({
  storeSelection: 'current',
  template: '',
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});

const exporting = ref(false);

const templates = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Desain bersih dan sederhana dengan fokus pada data',
    tags: ['Clean', 'Simple'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Desain kontemporer dengan header biru dan styling modern',
    tags: ['Modern', 'Blue'],
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Desain klasik dengan border luar dan font tradisional',
    tags: ['Classic', 'Traditional'],
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Desain berwarna dengan striped rows dan header biru',
    tags: ['Colorful', 'UI Style'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Desain elegan dengan tema hijau dan tipografi yang rapi',
    tags: ['Elegant', 'Green'],
  },
];

watch(() => props.show, (newVal) => {
  if (newVal && props.currentTenantId) {
    exportForm.value.storeSelection = 'current';
  }
});

const handleExport = async () => {
  if (!exportForm.value.template || !exportForm.value.storeSelection) {
    await showError('Silakan pilih template dan store');
    return;
  }

  exporting.value = true;
  try {
    const selectedTenants = exportForm.value.storeSelection === 'all'
      ? props.tenants
      : exportForm.value.storeSelection === 'current'
      ? props.tenants.filter(t => t.id === props.currentTenantId)
      : props.tenants.filter(t => t.id === exportForm.value.storeSelection);

    await generateReportPDF({
      template: exportForm.value.template,
      tenants: selectedTenants,
      stats: props.stats,
      startDate: exportForm.value.startDate,
      endDate: exportForm.value.endDate,
    });

    await showSuccess('Laporan berhasil diekspor');
    emit('close');
  } catch (error: any) {
    console.error('Error exporting report:', error);
    await showError(error.message || 'Gagal mengekspor laporan');
  } finally {
    exporting.value = false;
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

