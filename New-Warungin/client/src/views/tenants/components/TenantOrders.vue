<template>
  <div class="flex flex-col h-full">
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Pesanan Tenant</h3>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari pesanan..."
              class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>
        <select
          v-model="filters.status"
          class="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <p class="text-gray-500">Belum ada pesanan</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Pesanan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ order.customerName || 'Pelanggan Umum' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ formatCurrency(order.total) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDateTime(order.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="viewOrder(order)"
                    class="text-primary-600 hover:text-primary-900"
                  >
                    Detail
                  </button>
                  <button
                    v-if="order.status === 'PENDING' || order.status === 'PROCESSING'"
                    @click="editOrder(order)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    v-if="order.status === 'PENDING' || order.status === 'PROCESSING'"
                    @click="updateOrderStatus(order.id, 'CANCELLED')"
                    class="text-yellow-600 hover:text-yellow-900"
                  >
                    Batalkan
                  </button>
                  <button
                    v-if="order.status === 'COMPLETED' || order.status === 'CANCELLED'"
                    @click="deleteOrder(order.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../../api';
import { formatCurrency } from '../../../utils/formatters';
import { useNotification } from '../../../composables/useNotification';

const { error: showError, info: showInfo } = useNotification();

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();

const { success, error, confirm: confirmDialog } = useNotification();
const orders = ref<any[]>([]);
const loading = ref(false);
const showEditModal = ref(false);
const editingOrder = ref<any>(null);
const filters = ref({
  search: '',
  status: '',
});

const filteredOrders = computed(() => {
  let result = orders.value;
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(o =>
      o.orderNumber?.toLowerCase().includes(search) ||
      o.customerName?.toLowerCase().includes(search)
    );
  }
  if (filters.value.status) {
    result = result.filter(o => o.status === filters.value.status);
  }
  return result;
});

const loadOrders = async () => {
  if (!props.tenantId) return;
  
  loading.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    // Use maximum allowed limit (100) and load all pages if needed
    let allOrders: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await api.get('/orders', {
        params: { 
          page,
          limit: 100, // Maximum allowed by validator
        },
      });
      
      const pageData = response.data.data || response.data;
      if (Array.isArray(pageData)) {
        allOrders = [...allOrders, ...pageData];
      } else if (Array.isArray(response.data)) {
        allOrders = [...allOrders, ...response.data];
      }
      
      // Check if there are more pages
      const pagination = response.data.pagination;
      if (pagination) {
        hasMore = page < pagination.totalPages;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    orders.value = allOrders;
  } catch (err: any) {
    console.error('Error loading orders:', err);
    error('Gagal memuat pesanan', 'Terjadi Kesalahan');
  } finally {
    loading.value = false;
  }
};

const viewOrder = async (order: any) => {
  try {
    const response = await api.get(`/orders/${order.id}`);
    const fullOrder = response.data;
    // Show order details in a simple alert for now
    const items = fullOrder.items?.map((item: any) => 
      `${item.product?.name || item.productName} x${item.quantity}`
    ).join('\n') || 'Tidak ada item';
    
    const message = `Detail Pesanan: ${fullOrder.orderNumber}\n\n` +
      `Pelanggan: ${fullOrder.member?.name || fullOrder.customer?.name || fullOrder.temporaryCustomerName || 'Pelanggan Umum'}\n` +
      `Status: ${getStatusLabel(fullOrder.status)}\n` +
      `Items:\n${items}\n\n` +
      `Total: ${formatCurrency(fullOrder.total)}`;
    
    // Show order details in info notification
    await showInfo(message);
  } catch (err: any) {
    console.error('Error loading order details:', err);
    await showError('Gagal memuat detail pesanan');
  }
};

const editOrder = (order: any) => {
  editingOrder.value = order;
  showEditModal.value = true;
};

const updateOrder = async (orderId: string, data: any) => {
  try {
    await api.put(`/orders/${orderId}`, data);
    await loadOrders();
    success('Pesanan berhasil diupdate', 'Berhasil');
    showEditModal.value = false;
    editingOrder.value = null;
  } catch (err: any) {
    console.error('Error updating order:', err);
    error(err.response?.data?.message || 'Gagal mengupdate pesanan', 'Terjadi Kesalahan');
  }
};

const updateOrderStatus = async (orderId: string, status: string) => {
  const statusLabel = getStatusLabel(status);
  const confirmed = await confirmDialog(
    `Apakah Anda yakin ingin mengubah status pesanan menjadi "${statusLabel}"?`,
    'Konfirmasi Update Status',
    'Ya, Update',
    'Batal'
  );
  
  if (!confirmed) return;
  
  try {
    await api.put(`/orders/${orderId}/status`, { status });
    await loadOrders();
    success(`Status pesanan berhasil diubah menjadi "${statusLabel}"`, 'Berhasil');
  } catch (err: any) {
    console.error('Error updating order status:', err);
    error(err.response?.data?.message || 'Gagal mengupdate status pesanan', 'Terjadi Kesalahan');
  }
};

const deleteOrder = async (orderId: string) => {
  const confirmed = await confirmDialog(
    'Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.',
    'Konfirmasi Hapus Pesanan',
    'Ya, Hapus',
    'Batal'
  );
  
  if (!confirmed) return;
  
  try {
    // First cancel the order to restore stock, then we can delete it
    // Actually, we should just cancel it, not delete it for data integrity
    await api.put(`/orders/${orderId}/status`, { status: 'CANCELLED' });
    await loadOrders();
    success('Pesanan berhasil dibatalkan', 'Berhasil');
  } catch (err: any) {
    console.error('Error deleting order:', err);
    error(err.response?.data?.message || 'Gagal menghapus pesanan', 'Terjadi Kesalahan');
  }
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('id-ID');
};

watch(() => props.tenantId, (newTenantId, oldTenantId) => {
  // Only reload if tenantId actually changed
  if (newTenantId && newTenantId !== oldTenantId) {
    // Ensure tenantId is set in localStorage for API interceptor
    localStorage.setItem('selectedTenantId', newTenantId);
    // Small delay to ensure localStorage is updated
    setTimeout(() => {
      loadOrders();
    }, 100);
  }
}, { immediate: true });
</script>

