<template>
  <div class="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
    <!-- Store Selector (only for Admin/Supervisor) -->
    <div v-if="authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN' || authStore.user?.role === 'SUPERVISOR'" class="px-4 sm:px-6 pt-4 sm:pt-6">
      <StoreSelector @store-changed="handleStoreChange" />
    </div>
    
    <!-- Header Section -->
    <div class="mb-6 px-4 sm:px-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Pesanan Masuk</h2>
          <p class="text-sm sm:text-base text-gray-600">Kelola pesanan yang dikirim dari kasir</p>
        </div>
        <div v-if="selectedOrders.length > 0" class="flex flex-wrap items-center gap-3 bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4">
          <span class="text-sm font-medium bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg">
            {{ selectedOrders.length }} pesanan dipilih
          </span>
          <select
            v-model="bulkStatus"
            class="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
          >
            <option value="">Pilih Status</option>
            <option value="COOKING">Sedang Dimasak</option>
            <option value="READY">Siap</option>
            <option value="SERVED">Sudah Dikirim</option>
          </select>
          <button
            @click="bulkUpdateStatus"
            :disabled="!bulkStatus || bulkUpdating"
            class="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="!bulkUpdating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ bulkUpdating ? 'Memproses...' : 'Update Semua' }}
          </button>
          <button
            @click="clearSelection"
            class="px-3 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 px-4 sm:px-6">
      <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div class="text-gray-600 font-medium">Memuat pesanan...</div>
    </div>

    <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-20 px-4 sm:px-6">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-gray-600 text-lg font-medium">Tidak ada pesanan masuk</p>
        <p class="text-gray-500 text-sm mt-2">Pesanan dari kasir akan muncul di sini</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6 pb-4 sm:pb-6">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-xl shadow-lg p-5 sm:p-6 border-2 transition-all hover:shadow-xl"
        :class="[
          getStatusClass(order.kitchenStatus),
          selectedOrders.includes(order.id) ? 'ring-2 ring-primary-500 ring-offset-2 scale-[1.02]' : ''
        ]"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              :checked="selectedOrders.includes(order.id)"
              @change="toggleOrderSelection(order.id)"
              class="mt-1.5 w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <div class="flex-1">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-1">Pesanan #{{ order.orderNumber }}</h3>
              <p class="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDateTime(order.createdAt) }}
              </p>
            </div>
          </div>
          <span
            class="px-3 py-1.5 text-xs font-bold rounded-full shadow-sm"
            :class="getStatusBadgeClass(order.kitchenStatus)"
          >
            {{ getStatusLabel(order.kitchenStatus) }}
          </span>
        </div>

        <div class="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
          <p class="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Pelanggan
          </p>
          <p class="text-sm font-semibold text-gray-900">{{ order.customerName || order.temporaryCustomerName || 'Pelanggan Umum' }}</p>
        </div>

        <div class="mb-4">
          <p class="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Items
          </p>
          <div class="space-y-2">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <span class="text-sm text-gray-700 font-medium">{{ item.product?.name || item.productName }} × {{ item.quantity }}</span>
              <span class="text-sm text-gray-900 font-semibold">{{ formatCurrency(Number(item.price || item.subtotal) * item.quantity) }}</span>
            </div>
          </div>
        </div>

        <div class="mb-4 p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border-2 border-primary-200">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-700">Total:</span>
            <span class="text-lg font-bold text-primary-600">{{ formatCurrency(order.total) }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            v-if="order.kitchenStatus === 'PENDING'"
            @click="updateStatus(order.id, 'COOKING')"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mulai Masak
          </button>
          <button
            v-if="order.kitchenStatus === 'COOKING'"
            @click="updateStatus(order.id, 'READY')"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Selesai
          </button>
          <button
            v-if="order.kitchenStatus === 'READY'"
            @click="updateStatus(order.id, 'SERVED')"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Dikirim
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import api from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import { useSocket } from '../../composables/useSocket';
import { useNotification } from '../../composables/useNotification';
import StoreSelector from '../../components/StoreSelector.vue';

const authStore = useAuthStore();
const { socket, connected } = useSocket();
const { success, error, confirm: confirmDialog } = useNotification();
const orders = ref<any[]>([]);
const loading = ref(false);
const selectedOrders = ref<string[]>([]);
const bulkStatus = ref<string>('');
const bulkUpdating = ref(false);

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'border-red-300 bg-red-50',
    COOKING: 'border-orange-300 bg-orange-50',
    READY: 'border-green-300 bg-green-50',
    SERVED: 'border-blue-300 bg-blue-50',
  };
  return classes[status] || 'border-gray-300';
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-red-100 text-red-800',
    COOKING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    SERVED: 'bg-blue-100 text-blue-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Menunggu',
    COOKING: 'Sedang Dimasak',
    READY: 'Siap',
    SERVED: 'Sudah Dikirim',
  };
  return labels[status] || status;
};

const handleStoreChange = () => {
  // Reload orders when store changes
  loadOrders();
};

const loadOrders = async () => {
  if (!authStore.isAuthenticated) return; // Don't load if not authenticated
  
  loading.value = true;
  try {
    const response = await api.get('/orders', {
      params: {
        sendToKitchen: true, // Hanya ambil yang dikirim dari POS
        kitchenStatus: ['PENDING', 'COOKING', 'READY'], // Hanya yang belum selesai
      },
    });
    orders.value = response.data.data || response.data;
    // Clear selection when orders reload
    selectedOrders.value = [];
  } catch (err: any) {
    // Suppress errors during logout (401/403)
    if (err.response?.status === 401 || err.response?.status === 403) {
      return;
    }
    console.error('Error loading orders:', err);
    if (authStore.isAuthenticated) {
      error('Gagal memuat pesanan', 'Terjadi Kesalahan');
    }
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (orderId: string, status: string) => {
  try {
    await api.put(`/orders/${orderId}/kitchen-status`, { status });
    await loadOrders();
    
    // Emit socket event for realtime update
    if (socket?.connected) {
      socket.emit('order:update', { orderId, status });
    }
    
    success(`Status pesanan berhasil diubah menjadi "${getStatusLabel(status)}"`, 'Berhasil');
  } catch (err: any) {
    console.error('Error updating status:', err);
    error(err.response?.data?.message || 'Gagal mengupdate status', 'Terjadi Kesalahan');
  }
};

const toggleOrderSelection = (orderId: string) => {
  const index = selectedOrders.value.indexOf(orderId);
  if (index > -1) {
    selectedOrders.value.splice(index, 1);
  } else {
    selectedOrders.value.push(orderId);
  }
};

const clearSelection = () => {
  selectedOrders.value = [];
  bulkStatus.value = '';
};

const bulkUpdateStatus = async () => {
  if (!bulkStatus.value || selectedOrders.value.length === 0) {
    return;
  }

  const confirmed = await confirmDialog(
    `Apakah Anda yakin ingin mengubah status ${selectedOrders.value.length} pesanan menjadi "${getStatusLabel(bulkStatus.value)}"?`,
    'Konfirmasi Update Status',
    'Ya, Update',
    'Batal'
  );

  if (!confirmed) {
    return;
  }

  bulkUpdating.value = true;
  try {
    const response = await api.put('/orders/bulk-update-kitchen', {
      orderIds: selectedOrders.value,
      status: bulkStatus.value,
    });

    success(
      `Berhasil mengupdate ${response.data.updated} pesanan menjadi "${getStatusLabel(bulkStatus.value)}"`,
      'Update Berhasil'
    );
    clearSelection();
    await loadOrders();

    // Emit socket events for realtime update
    if (socket?.connected) {
      selectedOrders.value.forEach(orderId => {
        socket.emit('order:update', { orderId, kitchenStatus: bulkStatus.value });
      });
    }
  } catch (err: any) {
    console.error('Error bulk updating status:', err);
    error(err.response?.data?.message || 'Gagal mengupdate status', 'Terjadi Kesalahan');
  } finally {
    bulkUpdating.value = false;
  }
};

// Socket.IO event listeners
const setupSocketListeners = () => {
  if (!socket) return;

  socket.on('order:new', () => {
    // Reload orders when new order comes in
    loadOrders();
  });

  socket.on('order:update', (data: any) => {
    // Update specific order if it exists
    const index = orders.value.findIndex(o => o.id === data.orderId);
    if (index !== -1) {
      orders.value[index] = { ...orders.value[index], ...data };
    } else {
      // Reload all orders if order not found
      loadOrders();
    }
  });
};

// Polling fallback if socket not connected
// Disabled for Super Admin in Tenant Support to prevent auto-refresh
let pollInterval: number | null = null;

const startPolling = () => {
  if (connected.value) return; // Don't poll if socket is connected
  
  // Don't poll for Super Admin in Tenant Support mode
  const authStore = useAuthStore();
  const isSuperAdminInTenantSupport = authStore.isSuperAdmin && localStorage.getItem('selectedTenantId');
  if (isSuperAdminInTenantSupport) {
    return; // Disable polling to prevent auto-refresh
  }
  
  pollInterval = window.setInterval(() => {
    loadOrders();
  }, 30000); // Poll every 30 seconds (reduced from 5 seconds)
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

watch(connected, (isConnected) => {
  if (isConnected) {
    stopPolling();
    setupSocketListeners();
  } else {
    startPolling();
  }
});

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadOrders();
  
  if (connected.value) {
    setupSocketListeners();
  } else {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>
