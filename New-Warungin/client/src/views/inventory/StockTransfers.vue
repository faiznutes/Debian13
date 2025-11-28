<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Stock Transfers</h2>
        <p class="text-gray-600">Transfer stok antar outlet</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Buat Transfer</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex items-center space-x-4">
      <select
        v-model="statusFilter"
        @change="loadTransfers"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="IN_TRANSIT">In Transit</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Transfers List -->
    <div v-else class="space-y-4">
      <div
        v-for="transfer in transfers"
        :key="transfer.id"
        class="bg-white rounded-lg shadow-lg p-6 border-l-4"
        :class="getStatusBorderClass(transfer.status)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ transfer.transferNumber }}</h3>
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="getStatusClass(transfer.status)"
              >
                {{ transfer.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p class="text-gray-500">From Outlet</p>
                <p class="font-semibold text-gray-900">{{ transfer.fromOutletId }}</p>
              </div>
              <div>
                <p class="text-gray-500">To Outlet</p>
                <p class="font-semibold text-gray-900">{{ transfer.toOutletId }}</p>
              </div>
              <div>
                <p class="text-gray-500">Transfer Date</p>
                <p class="font-semibold text-gray-900">{{ formatDate(transfer.transferDate) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Items</p>
                <p class="font-semibold text-gray-900">{{ transfer.items.length }} items</p>
              </div>
            </div>
            <div class="border-t pt-4">
              <p class="text-sm font-semibold text-gray-700 mb-2">Items:</p>
              <div class="space-y-2">
                <div
                  v-for="item in transfer.items"
                  :key="item.id"
                  class="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <span class="font-medium">{{ item.product.name }}</span>
                  <span class="text-gray-600">Qty: {{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end space-y-2 ml-4">
            <button
              v-if="transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT'"
              @click="receiveTransfer(transfer)"
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              Receive
            </button>
            <button
              v-if="transfer.status !== 'COMPLETED' && transfer.status !== 'CANCELLED'"
              @click="cancelTransfer(transfer)"
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Buat Stock Transfer</h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveTransfer" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">From Outlet *</label>
                <select
                  v-model="transferForm.fromOutletId"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Pilih Outlet</option>
                  <option v-for="outlet in outlets" :key="outlet.id" :value="outlet.id">
                    {{ outlet.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">To Outlet *</label>
                <select
                  v-model="transferForm.toOutletId"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Pilih Outlet</option>
                  <option v-for="outlet in outlets" :key="outlet.id" :value="outlet.id">
                    {{ outlet.name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="transferForm.notes"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">Items *</label>
                <button
                  type="button"
                  @click="addItem"
                  class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                >
                  + Add Item
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(item, index) in transferForm.items"
                  :key="index"
                  class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded"
                >
                  <div class="col-span-8">
                    <select
                      v-model="item.productId"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    >
                      <option value="">Pilih Product</option>
                      <option v-for="product in products" :key="product.id" :value="product.id">
                        {{ product.name }} (Stock: {{ product.stock }})
                      </option>
                    </select>
                  </div>
                  <div class="col-span-3">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div class="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      @click="removeItem(index)"
                      class="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || transferForm.items.length === 0"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Buat Transfer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface StockTransfer {
  id: string;
  transferNumber: string;
  fromOutletId: string;
  toOutletId: string;
  status: string;
  transferDate: string;
  items: Array<{
    id: string;
    product: { id: string; name: string };
    quantity: number;
  }>;
}

const transfers = ref<StockTransfer[]>([]);
const outlets = ref<any[]>([]);
const products = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');
const showCreateModal = ref(false);
const saving = ref(false);

const transferForm = ref({
  fromOutletId: '',
  toOutletId: '',
  notes: '',
  items: [{ productId: '', quantity: 1 }],
});

const loadTransfers = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const response = await api.get('/stock-transfers', { params });
    transfers.value = response.data.data;
  } catch (error: any) {
    console.error('Error loading transfers:', error);
    await showError('Gagal memuat stock transfers');
  } finally {
    loading.value = false;
  }
};

const loadOutlets = async () => {
  try {
    const response = await api.get('/outlets', { params: { limit: 100 } });
    outlets.value = response.data.data || response.data;
  } catch (error: any) {
    console.error('Error loading outlets:', error);
  }
};

const loadProducts = async () => {
  try {
    const response = await api.get('/products', { params: { limit: 100, isActive: true } });
    products.value = response.data.data;
  } catch (error: any) {
    console.error('Error loading products:', error);
  }
};

const addItem = () => {
  transferForm.value.items.push({ productId: '', quantity: 1 });
};

const removeItem = (index: number) => {
  transferForm.value.items.splice(index, 1);
};

const saveTransfer = async () => {
  saving.value = true;
  try {
    const data = {
      fromOutletId: transferForm.value.fromOutletId,
      toOutletId: transferForm.value.toOutletId,
      notes: transferForm.value.notes || undefined,
      items: transferForm.value.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
    await api.post('/stock-transfers', data);
    await showSuccess('Stock transfer berhasil dibuat');
    closeModal();
    await loadTransfers();
  } catch (error: any) {
    console.error('Error saving transfer:', error);
    await showError('Gagal menyimpan stock transfer');
  } finally {
    saving.value = false;
  }
};

const receiveTransfer = async (transfer: StockTransfer) => {
  const confirmed = await showConfirm(
    'Receive Stock Transfer',
    'Apakah Anda yakin ingin receive stock transfer ini? Stock akan diupdate.'
  );
  if (!confirmed) return;

  try {
    await api.post(`/stock-transfers/${transfer.id}/receive`);
    await showSuccess('Stock transfer berhasil di-receive, stock telah diupdate');
    await loadTransfers();
  } catch (error: any) {
    console.error('Error receiving transfer:', error);
    await showError('Gagal receive stock transfer');
  }
};

const cancelTransfer = async (transfer: StockTransfer) => {
  const confirmed = await showConfirm(
    'Cancel Stock Transfer',
    'Apakah Anda yakin ingin membatalkan stock transfer ini?'
  );
  if (!confirmed) return;

  try {
    await api.post(`/stock-transfers/${transfer.id}/cancel`);
    await showSuccess('Stock transfer berhasil dibatalkan');
    await loadTransfers();
  } catch (error: any) {
    console.error('Error cancelling transfer:', error);
    await showError('Gagal membatalkan stock transfer');
  }
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_TRANSIT: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusBorderClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'border-yellow-500',
    IN_TRANSIT: 'border-blue-500',
    COMPLETED: 'border-green-500',
    CANCELLED: 'border-gray-500',
  };
  return classes[status] || 'border-gray-500';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID');
};

const closeModal = () => {
  showCreateModal.value = false;
  transferForm.value = {
    fromOutletId: '',
    toOutletId: '',
    notes: '',
    items: [{ productId: '', quantity: 1 }],
  };
};

onMounted(() => {
  loadTransfers();
  loadOutlets();
  loadProducts();
});
</script>

