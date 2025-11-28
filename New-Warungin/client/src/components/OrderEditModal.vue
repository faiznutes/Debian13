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
              <h3 class="text-xl font-bold text-gray-900">Edit Pesanan</h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="order" class="space-y-6">
              <!-- Order Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Nomor Pesanan:</span>
                    <span class="font-semibold ml-2">{{ order.orderNumber }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Status:</span>
                    <span class="font-semibold ml-2">{{ getStatusLabel(order.status) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Tanggal:</span>
                    <span class="ml-2">{{ formatDateTime(order.createdAt) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Total:</span>
                    <span class="font-semibold ml-2">{{ formatCurrency(Number(order.total)) }}</span>
                  </div>
                </div>
              </div>

              <!-- Order Items -->
              <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Item Pesanan</h4>
                <div class="space-y-3">
                  <div
                    v-for="(item, index) in orderItems"
                    :key="index"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">{{ item.product?.name || item.name }}</div>
                      <div class="text-sm text-gray-600 mt-1">
                        Harga: {{ formatCurrency(Number(item.price)) }} x {{ item.quantity }}
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="flex items-center space-x-2">
                        <button
                          @click="updateItemQuantity(index, -1)"
                          :disabled="item.quantity <= 1"
                          class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="1"
                          class="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                          @change="updateItemTotal(index)"
                        />
                        <button
                          @click="updateItemQuantity(index, 1)"
                          class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <div class="text-right">
                        <div class="font-semibold text-gray-900">{{ formatCurrency(Number(item.subtotal)) }}</div>
                      </div>
                      <button
                        @click="removeItem(index)"
                        class="text-red-600 hover:text-red-800 p-2"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Add Product (if needed) -->
              <div class="border-t pt-4">
                <button
                  @click="showAddProduct = true"
                  class="px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
                >
                  + Tambah Produk
                </button>
              </div>

              <!-- Summary -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Subtotal:</span>
                    <span class="font-semibold">{{ formatCurrency(calculatedSubtotal) }}</span>
                  </div>
                  <div v-if="order && Number(order.discount) > 0" class="flex justify-between text-sm">
                    <span class="text-gray-600">Diskon:</span>
                    <span class="font-semibold text-red-600">-{{ formatCurrency(Number(order.discount)) }}</span>
                  </div>
                  <div class="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span class="text-primary-600">{{ formatCurrency(calculatedTotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  @click="handleSave"
                  :disabled="saving || orderItems.length === 0"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
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
import { ref, computed, watch } from 'vue';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import api from '../api';

interface OrderItem {
  id?: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
  };
  name?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string | number;
  subtotal: string | number;
  discount: string | number;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  show: boolean;
  order: Order | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  saved: [order: Order];
}>();

const loading = ref(false);
const saving = ref(false);
const orderItems = ref<OrderItem[]>([]);
const showAddProduct = ref(false);

const calculatedSubtotal = computed(() => {
  return orderItems.value.reduce((sum, item) => {
    return sum + (Number(item.price) * item.quantity);
  }, 0);
});

const calculatedTotal = computed(() => {
  const discount = Number(props.order?.discount || 0);
  return calculatedSubtotal.value - discount;
});

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUNDED: 'Refund',
  };
  return labels[status] || status;
};

watch(() => props.order, (newOrder) => {
  if (newOrder) {
    // Clone items untuk editing
    orderItems.value = newOrder.items.map(item => ({
      ...item,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    }));
  }
}, { immediate: true });

const updateItemQuantity = (index: number, delta: number) => {
  const item = orderItems.value[index];
  const newQuantity = Math.max(1, item.quantity + delta);
  item.quantity = newQuantity;
  updateItemTotal(index);
};

const updateItemTotal = (index: number) => {
  const item = orderItems.value[index];
  item.subtotal = Number(item.price) * item.quantity;
};

const removeItem = (index: number) => {
  orderItems.value.splice(index, 1);
};

const handleSave = async () => {
  if (orderItems.value.length === 0) {
    return;
  }

  saving.value = true;
  try {
    // Calculate new totals
    const newSubtotal = calculatedSubtotal.value;
    const discount = Number(props.order?.discount || 0);
    const newTotal = newSubtotal - discount;

    // Update order items
    const updateData: any = {
      items: orderItems.value.map(item => ({
        productId: item.productId || item.product?.id,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: newSubtotal.toString(),
      total: newTotal.toString(),
    };

    const response = await api.put(`/orders/${props.order?.id}`, updateData);
    emit('saved', response.data);
    emit('close');
  } catch (error: any) {
    console.error('Error updating order:', error);
    // Error handling will be done by parent component
    throw error;
  } finally {
    saving.value = false;
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

