<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <p class="text-gray-600">Kelola purchase order untuk restock produk</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Buat Purchase Order</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex items-center space-x-4">
      <select
        v-model="statusFilter"
        @change="loadPurchaseOrders"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="ORDERED">Ordered</option>
        <option value="RECEIVED">Received</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <select
        v-model="supplierFilter"
        @change="loadPurchaseOrders"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">All Suppliers</option>
        <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
          {{ supplier.name }}
        </option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Purchase Orders List -->
    <div v-else class="space-y-4">
      <div
        v-for="po in purchaseOrders"
        :key="po.id"
        class="bg-white rounded-lg shadow-lg p-6 border-l-4"
        :class="getStatusBorderClass(po.status)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ po.orderNumber }}</h3>
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="getStatusClass(po.status)"
              >
                {{ po.status }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Supplier: <span class="font-semibold">{{ po.supplier.name }}</span>
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p class="text-gray-500">Order Date</p>
                <p class="font-semibold text-gray-900">{{ formatDate(po.orderDate) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Expected Date</p>
                <p class="font-semibold text-gray-900">{{ po.expectedDate ? formatDate(po.expectedDate) : '-' }}</p>
              </div>
              <div>
                <p class="text-gray-500">Total Amount</p>
                <p class="font-semibold text-gray-900">Rp {{ formatCurrency(po.totalAmount) }}</p>
              </div>
              <div>
                <p class="text-gray-500">Items</p>
                <p class="font-semibold text-gray-900">{{ po.items.length }} items</p>
              </div>
            </div>
            <div class="border-t pt-4">
              <p class="text-sm font-semibold text-gray-700 mb-2">Items:</p>
              <div class="space-y-2">
                <div
                  v-for="item in po.items"
                  :key="item.id"
                  class="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span class="font-medium">{{ item.product.name }}</span>
                    <span class="text-gray-500 ml-2">({{ item.quantity }}x @ Rp {{ formatCurrency(item.unitPrice) }})</span>
                  </div>
                  <span class="font-semibold">Rp {{ formatCurrency(item.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end space-y-2 ml-4">
            <button
              v-if="po.status === 'PENDING'"
              @click="approvePurchaseOrder(po)"
              class="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition"
            >
              Approve
            </button>
            <button
              v-if="po.status === 'ORDERED' || po.status === 'APPROVED'"
              @click="receivePurchaseOrder(po)"
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              Receive
            </button>
            <button
              v-if="po.status !== 'RECEIVED' && po.status !== 'CANCELLED'"
              @click="cancelPurchaseOrder(po)"
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
            >
              Cancel
            </button>
            <button
              @click="viewPurchaseOrder(po)"
              class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition"
            >
              View
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
            <h3 class="text-2xl font-bold text-gray-900">Buat Purchase Order</h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="savePurchaseOrder" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select
                  v-model="poForm.supplierId"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Pilih Supplier</option>
                  <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
                <input
                  v-model="poForm.expectedDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="poForm.notes"
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
                  v-for="(item, index) in poForm.items"
                  :key="index"
                  class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded"
                >
                  <div class="col-span-5">
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
                  <div class="col-span-2">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div class="col-span-3">
                    <input
                      v-model.number="item.unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Unit Price"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div class="col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      @click="removeItem(index)"
                      class="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t">
              <span class="text-lg font-semibold text-gray-900">Total: Rp {{ formatCurrency(calculateTotal) }}</span>
              <div class="flex space-x-3">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving || poForm.items.length === 0"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {{ saving ? 'Menyimpan...' : 'Buat PO' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { id: string; name: string };
  status: string;
  orderDate: string;
  expectedDate?: string;
  totalAmount: number;
  items: Array<{
    id: string;
    product: { id: string; name: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const purchaseOrders = ref<PurchaseOrder[]>([]);
const suppliers = ref<any[]>([]);
const products = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');
const supplierFilter = ref('');
const showCreateModal = ref(false);
const saving = ref(false);

const poForm = ref({
  supplierId: '',
  expectedDate: '',
  notes: '',
  items: [{ productId: '', quantity: 1, unitPrice: 0 }],
});

const calculateTotal = computed(() => {
  return poForm.value.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
});

const loadPurchaseOrders = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    if (supplierFilter.value) params.supplierId = supplierFilter.value;
    const response = await api.get('/purchase-orders', { params });
    purchaseOrders.value = response.data.data;
  } catch (error: any) {
    console.error('Error loading purchase orders:', error);
    await showError('Gagal memuat purchase orders');
  } finally {
    loading.value = false;
  }
};

const loadSuppliers = async () => {
  try {
    const response = await api.get('/suppliers', { params: { limit: 100 } });
    suppliers.value = response.data.data;
  } catch (error: any) {
    console.error('Error loading suppliers:', error);
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
  poForm.value.items.push({ productId: '', quantity: 1, unitPrice: 0 });
};

const removeItem = (index: number) => {
  poForm.value.items.splice(index, 1);
};

const savePurchaseOrder = async () => {
  saving.value = true;
  try {
    const data = {
      supplierId: poForm.value.supplierId,
      expectedDate: poForm.value.expectedDate || undefined,
      notes: poForm.value.notes || undefined,
      items: poForm.value.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
    await api.post('/purchase-orders', data);
    await showSuccess('Purchase order berhasil dibuat');
    closeModal();
    await loadPurchaseOrders();
  } catch (error: any) {
    console.error('Error saving purchase order:', error);
    await showError('Gagal menyimpan purchase order');
  } finally {
    saving.value = false;
  }
};

const approvePurchaseOrder = async (po: PurchaseOrder) => {
  try {
    await api.put(`/purchase-orders/${po.id}`, { status: 'APPROVED' });
    await showSuccess('Purchase order berhasil diapprove');
    await loadPurchaseOrders();
  } catch (error: any) {
    console.error('Error approving purchase order:', error);
    await showError('Gagal approve purchase order');
  }
};

const receivePurchaseOrder = async (po: PurchaseOrder) => {
  const confirmed = await showConfirm(
    'Receive Purchase Order',
    'Apakah Anda yakin ingin receive purchase order ini? Stock akan diupdate.'
  );
  if (!confirmed) return;

  try {
    await api.post(`/purchase-orders/${po.id}/receive`);
    await showSuccess('Purchase order berhasil di-receive, stock telah diupdate');
    await loadPurchaseOrders();
  } catch (error: any) {
    console.error('Error receiving purchase order:', error);
    await showError('Gagal receive purchase order');
  }
};

const cancelPurchaseOrder = async (po: PurchaseOrder) => {
  const confirmed = await showConfirm(
    'Cancel Purchase Order',
    'Apakah Anda yakin ingin membatalkan purchase order ini?'
  );
  if (!confirmed) return;

  try {
    await api.post(`/purchase-orders/${po.id}/cancel`);
    await showSuccess('Purchase order berhasil dibatalkan');
    await loadPurchaseOrders();
  } catch (error: any) {
    console.error('Error cancelling purchase order:', error);
    await showError('Gagal membatalkan purchase order');
  }
};

const viewPurchaseOrder = (po: PurchaseOrder) => {
  // TODO: Implement detail view modal
  console.log('View PO:', po);
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    ORDERED: 'bg-purple-100 text-purple-800',
    RECEIVED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusBorderClass = (status: string): string => {
  const classes: Record<string, string> = {
    PENDING: 'border-yellow-500',
    APPROVED: 'border-blue-500',
    ORDERED: 'border-purple-500',
    RECEIVED: 'border-green-500',
    CANCELLED: 'border-gray-500',
  };
  return classes[status] || 'border-gray-500';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID');
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const closeModal = () => {
  showCreateModal.value = false;
  poForm.value = {
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  };
};

onMounted(() => {
  loadPurchaseOrders();
  loadSuppliers();
  loadProducts();
});
</script>

