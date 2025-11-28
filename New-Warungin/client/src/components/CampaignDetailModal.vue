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
              <h3 class="text-xl font-bold text-gray-900">Detail Campaign</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="campaign" class="space-y-6">
              <!-- Campaign Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Nama Campaign</p>
                    <p class="text-lg font-semibold text-gray-900">{{ campaign.name }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Status</p>
                    <span
                      class="px-3 py-1 text-sm font-semibold rounded-full"
                      :class="getStatusClass(campaign.status)"
                    >
                      {{ getStatusLabel(campaign.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Campaign Details -->
              <div class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Informasi Campaign</h5>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-gray-600">Tipe</p>
                    <p class="text-base font-medium text-gray-900">{{ campaign.type || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Target Audience</p>
                    <p class="text-base font-medium text-gray-900">{{ campaign.targetAudience || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Tanggal Mulai</p>
                    <p class="text-base font-medium text-gray-900">{{ formatDate(campaign.startDate) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Tanggal Berakhir</p>
                    <p class="text-base font-medium text-gray-900">{{ formatDate(campaign.endDate) }}</p>
                  </div>
                </div>
              </div>

              <!-- Campaign Stats -->
              <div class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Statistik</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary-600">{{ campaign.opens || 0 }}</p>
                    <p class="text-sm text-gray-600">Opens</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-green-600">{{ campaign.clicks || 0 }}</p>
                    <p class="text-sm text-gray-600">Clicks</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-blue-600">{{ campaign.conversions || 0 }}</p>
                    <p class="text-sm text-gray-600">Conversions</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  v-if="campaign.status === 'DRAFT'"
                  @click="$emit('send', campaign.id)"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Kirim Campaign
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
interface Campaign {
  id: string;
  name: string;
  type?: string;
  targetAudience?: string;
  startDate: string;
  endDate: string;
  status: string;
  opens?: number;
  clicks?: number;
  conversions?: number;
}

interface Props {
  show: boolean;
  campaign: Campaign | null;
}

defineProps<Props>();

defineEmits<{
  close: [];
  send: [campaignId: string];
}>();

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SCHEDULED: 'Terjadwal',
    SENT: 'Terkirim',
    ACTIVE: 'Aktif',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };
  return labels[status] || status;
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    SENT: 'bg-green-100 text-green-800',
    ACTIVE: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

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

