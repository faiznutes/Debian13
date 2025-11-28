<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900">Detail Pelanggan</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="customer" class="space-y-6">
              <!-- Profile Section -->
              <div class="flex items-start space-x-4 pb-6 border-b border-gray-200">
                <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-primary-600 font-semibold text-2xl">
                    {{ customer.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 mb-1">{{ customer.name }}</h4>
                  <p v-if="customer.email" class="text-sm text-gray-600 mb-1">{{ customer.email }}</p>
                  <p v-if="customer.phone" class="text-sm text-gray-600">{{ customer.phone }}</p>
                </div>
              </div>

              <!-- Information Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Total Pesanan</p>
                  <p class="text-2xl font-bold text-gray-900">{{ customer.totalOrders || 0 }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-1">Total Belanja</p>
                  <p class="text-2xl font-bold text-primary-600">{{ formatCurrency(customer.totalSpent || 0) }}</p>
                </div>
              </div>

              <!-- Address Section -->
              <div v-if="customer.address" class="border-t border-gray-200 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 mb-2">Alamat</h5>
                <p class="text-sm text-gray-600">{{ customer.address }}</p>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  @click="$emit('edit', customer)"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Edit
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
import { formatCurrency } from '../utils/formatters';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
}

interface Props {
  show: boolean;
  customer: Customer | null;
}

defineProps<Props>();

defineEmits<{
  close: [];
  edit: [customer: Customer];
}>();
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

