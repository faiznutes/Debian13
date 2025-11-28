<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900">Detail Report</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="report" class="space-y-6">
              <!-- Report Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Nama Report</p>
                    <p class="text-lg font-semibold text-gray-900">{{ report.name }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Data Type</p>
                    <span class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ report.dataType }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Report Details -->
              <div class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Detail Report</h5>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-gray-600">Metrics</p>
                    <div class="flex flex-wrap gap-2 mt-1">
                      <span
                        v-for="metric in report.metrics"
                        :key="metric"
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {{ metric }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Tanggal Mulai</p>
                    <p class="text-base font-medium text-gray-900">{{ formatDate(report.startDate) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Tanggal Berakhir</p>
                    <p class="text-base font-medium text-gray-900">{{ formatDate(report.endDate) }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  @click="$emit('export', report)"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Export Report
                </button>
                <button
                  @click="$emit('close')"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Tutup
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
interface CustomReport {
  id: string;
  name: string;
  dataType: string;
  metrics: string[];
  startDate: string;
  endDate: string;
}

interface Props {
  show: boolean;
  report: CustomReport | null;
}

defineProps<Props>();

defineEmits<{
  close: [];
  export: [report: CustomReport];
}>();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

