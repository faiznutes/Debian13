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
              <h3 class="text-xl font-bold text-gray-900">Detail Delivery Order</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="order" class="space-y-6">
              <!-- Order Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Nomor Order</p>
                    <p class="text-lg font-semibold text-gray-900">{{ order.orderNumber }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Tanggal</p>
                    <p class="text-lg font-semibold text-gray-900">{{ formatDateTime(order.createdAt) }}</p>
                  </div>
                </div>
              </div>

              <!-- Customer Info -->
              <div class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Informasi Pelanggan</h5>
                <div class="space-y-2">
                  <div>
                    <p class="text-sm text-gray-600">Nama</p>
                    <p class="text-base font-medium text-gray-900">{{ order.customerName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Telepon</p>
                    <p class="text-base font-medium text-gray-900">{{ order.customerPhone }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Alamat</p>
                    <p class="text-base font-medium text-gray-900">{{ order.deliveryAddress }}</p>
                  </div>
                </div>
              </div>

              <!-- Delivery Info -->
              <div class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Informasi Pengiriman</h5>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Kurir</p>
                    <span class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ getCourierLabel(order.courier) }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 mb-1">Status</p>
                    <span
                      class="px-3 py-1 text-sm font-semibold rounded-full"
                      :class="getStatusClass(order.status)"
                    >
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <div v-if="order.trackingNumber" class="col-span-2">
                    <p class="text-sm text-gray-600 mb-1">Nomor Tracking</p>
                    <p class="text-base font-medium text-gray-900">{{ order.trackingNumber }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  v-if="order.status === 'PENDING'"
                  @click="$emit('process', order.id)"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Proses Order
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
import { formatDateTime } from '../utils/formatters';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  courier: string;
  trackingNumber?: string;
  status: string;
  createdAt: string;
}

interface Props {
  show: boolean;
  order: DeliveryOrder | null;
}

defineProps<Props>();

defineEmits<{
  close: [];
  process: [orderId: string];
}>();

const getCourierLabel = (courier: string) => {
  const labels: Record<string, string> = {
    GOSEND: 'GoSend',
    GRABEXPRESS: 'GrabExpress',
    JNE: 'JNE',
    JT: 'J&T',
    SICEPAT: 'SiCepat',
    MANUAL: 'Manual',
  };
  return labels[courier] || courier;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
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

