<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Delivery Orders</h2>
        <p class="text-sm sm:text-base text-gray-600">Kelola pesanan delivery dan tracking</p>
      </div>
      <div class="w-full sm:w-auto flex items-center gap-2 sm:gap-4">
        <button
          @click="showCourierModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Setup Kurir
        </button>
        <button
          @click="showPromoModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Buat Promo
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari order..."
            class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      <!-- Status & Courier Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Status Filter -->
        <div class="flex-1">
          <label class="block text-xs font-medium text-gray-700 mb-2">Status</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="filters.status = ''"
              :class="!filters.status 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Semua
            </button>
            <button
              @click="filters.status = 'PENDING'"
              :class="filters.status === 'PENDING' 
                ? 'bg-yellow-600 text-white border-yellow-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Pending
            </button>
            <button
              @click="filters.status = 'PROCESSING'"
              :class="filters.status === 'PROCESSING' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Processing
            </button>
            <button
              @click="filters.status = 'SHIPPED'"
              :class="filters.status === 'SHIPPED' 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Shipped
            </button>
            <button
              @click="filters.status = 'DELIVERED'"
              :class="filters.status === 'DELIVERED' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Delivered
            </button>
            <button
              @click="filters.status = 'CANCELLED'"
              :class="filters.status === 'CANCELLED' 
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Cancelled
            </button>
          </div>
        </div>

        <!-- Courier Filter -->
        <div class="flex-1">
          <label class="block text-xs font-medium text-gray-700 mb-2">Kurir</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="filters.courier = ''"
              :class="!filters.courier 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Semua
            </button>
            <button
              @click="filters.courier = 'GOSEND'"
              :class="filters.courier === 'GOSEND' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              GoSend
            </button>
            <button
              @click="filters.courier = 'GRABEXPRESS'"
              :class="filters.courier === 'GRABEXPRESS' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              GrabExpress
            </button>
            <button
              @click="filters.courier = 'JNE'"
              :class="filters.courier === 'JNE' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              JNE
            </button>
            <button
              @click="filters.courier = 'JT'"
              :class="filters.courier === 'JT' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              J&T
            </button>
            <button
              @click="filters.courier = 'SICEPAT'"
              :class="filters.courier === 'SICEPAT' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              SiCepat
            </button>
            <button
              @click="filters.courier = 'MANUAL'"
              :class="filters.courier === 'MANUAL' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              class="px-3 py-1.5 text-sm font-medium border rounded-lg transition-all"
            >
              Manual
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delivery Orders Table -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="deliveryOrders.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-gray-500">Belum ada delivery order</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kurir</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</div>
                <div class="text-sm text-gray-500">{{ formatDateTime(order.createdAt) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ order.customerName }}</div>
                <div class="text-sm text-gray-500">{{ order.customerPhone }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ getCourierLabel(order.courier) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">{{ order.deliveryAddress }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="order.trackingNumber" class="text-sm text-gray-900">{{ order.trackingNumber }}</div>
                <div v-else class="text-sm text-gray-400">-</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewOrder(order)"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Detail
                </button>
                <button
                  v-if="order.status === 'PENDING'"
                  @click="processDelivery(order.id)"
                  class="text-green-600 hover:text-green-900"
                >
                  Proses
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Courier Setup Modal -->
    <Teleport to="body">
      <div
        v-if="showCourierModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showCourierModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Setup Kurir</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Kurir</label>
              <select
                v-model="courierForm.courier"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kurir</option>
                <option value="GOSEND">GoSend</option>
                <option value="GRABEXPRESS">GrabExpress</option>
                <option value="JNE">JNE</option>
                <option value="JT">J&T</option>
                <option value="SICEPAT">SiCepat</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                v-model="courierForm.apiKey"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan API Key"
              />
            </div>
            <div class="flex space-x-3">
              <button
                @click="showCourierModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="saveCourier"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Promo Modal -->
    <Teleport to="body">
      <div
        v-if="showPromoModal"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showPromoModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Buat Promo</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Promo</label>
              <input
                v-model="promoForm.name"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Diskon Lebaran 20%"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Diskon</label>
              <select
                v-model="promoForm.type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nilai Diskon</label>
              <input
                v-model.number="promoForm.value"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="20 atau 50000"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Kode Promo</label>
              <input
                v-model="promoForm.code"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="LEBARAN20"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Mulai</label>
                <input
                  v-model="promoForm.startDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Berakhir</label>
                <input
                  v-model="promoForm.endDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div class="flex space-x-3">
              <button
                @click="showPromoModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                @click="savePromo"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delivery Order Detail Modal -->
    <DeliveryOrderDetailModal
      :show="showDetailModal"
      :order="viewingOrder"
      @close="showDetailModal = false; viewingOrder = null"
      @process="handleProcessFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../../api';
import { formatDateTime } from '../../utils/formatters';
import DeliveryOrderDetailModal from '../../components/DeliveryOrderDetailModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';

const { needsTenantSelection } = useTenantCheck();
const { success: showSuccess, error: showError } = useNotification();

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

const deliveryOrders = ref<DeliveryOrder[]>([]);
const loading = ref(false);
const showCourierModal = ref(false);
const showPromoModal = ref(false);
const showDetailModal = ref(false);
const viewingOrder = ref<DeliveryOrder | null>(null);
const filters = ref({
  search: '',
  status: '',
  courier: '',
});

const courierForm = ref({
  courier: '',
  apiKey: '',
});

const promoForm = ref({
  name: '',
  type: 'PERCENTAGE',
  value: 0,
  code: '',
  startDate: '',
  endDate: '',
});

const filteredOrders = computed(() => {
  let result = deliveryOrders.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(o =>
      o.orderNumber.toLowerCase().includes(search) ||
      o.customerName.toLowerCase().includes(search) ||
      o.trackingNumber?.toLowerCase().includes(search)
    );
  }

  if (filters.value.status) {
    result = result.filter(o => o.status === filters.value.status);
  }

  if (filters.value.courier) {
    result = result.filter(o => o.courier === filters.value.courier);
  }

  return result;
});

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

const loadDeliveryOrders = async () => {
  if (needsTenantSelection.value) return;

  loading.value = true;
  try {
    const response = await api.get('/delivery/orders');
    deliveryOrders.value = response.data.data || response.data || [];
  } catch (error: any) {
    console.error('Error loading delivery orders:', error);
    // If endpoint doesn't exist, use empty array
    deliveryOrders.value = [];
  } finally {
    loading.value = false;
  }
};

const viewOrder = (order: DeliveryOrder) => {
  viewingOrder.value = order;
  showDetailModal.value = true;
};

const handleProcessFromDetail = async (orderId: string) => {
  showDetailModal.value = false;
  await processDelivery(orderId);
};

const processDelivery = async (orderId: string) => {
  try {
    await api.post(`/delivery/orders/${orderId}/process`);
    await loadDeliveryOrders();
    await showSuccess('Order berhasil diproses');
  } catch (error: any) {
    console.error('Error processing delivery:', error);
    await showError(error.response?.data?.message || 'Gagal memproses order');
  }
};

const saveCourier = async () => {
  try {
    await api.post('/delivery/couriers', courierForm.value);
    await showSuccess('Kurir berhasil disetup');
    showCourierModal.value = false;
    courierForm.value = { courier: '', apiKey: '' };
  } catch (error: any) {
    console.error('Error saving courier:', error);
    await showError(error.response?.data?.message || 'Gagal menyimpan kurir');
  }
};

const savePromo = async () => {
  try {
    await api.post('/marketing/promos', promoForm.value);
    await showSuccess('Promo berhasil dibuat');
    showPromoModal.value = false;
    promoForm.value = {
      name: '',
      type: 'PERCENTAGE',
      value: 0,
      code: '',
      startDate: '',
      endDate: '',
    };
  } catch (error: any) {
    console.error('Error saving promo:', error);
    await showError(error.response?.data?.message || 'Gagal membuat promo');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadDeliveryOrders();
});
</script>

