<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Product Adjustments</h1>
        <p class="text-gray-600">Riwayat penyesuaian stok produk</p>
      </div>
      <button
        @click="showAdjustmentModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Penyesuaian
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Cari Produk</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nama produk atau SKU"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            @input="loadAdjustments"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
          <select
            v-model="filters.type"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            @change="loadAdjustments"
          >
            <option value="">Semua</option>
            <option value="INCREASE">Penambahan</option>
            <option value="DECREASE">Pengurangan</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            @change="loadAdjustments"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            @change="loadAdjustments"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Adjustments List -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oleh</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="adjustment in adjustments" :key="adjustment.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDateTime(adjustment.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex flex-col">
                  <span class="font-medium">{{ adjustment.product?.name || 'N/A' }}</span>
                  <span v-if="adjustment.product?.sku" class="text-xs text-gray-500">{{ adjustment.product.sku }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    adjustment.type === 'INCREASE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ adjustment.type === 'INCREASE' ? 'Penambahan' : 'Pengurangan' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="adjustment.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'">
                {{ adjustment.type === 'INCREASE' ? '+' : '-' }}{{ adjustment.quantity }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Sebelum: {{ adjustment.stockBefore }}</span>
                  <span class="font-medium">→ Sesudah: {{ adjustment.stockAfter }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" :title="adjustment.reason">
                {{ adjustment.reason }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ adjustment.user?.name || 'N/A' }}
              </td>
            </tr>
            <tr v-if="adjustments.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
                Belum ada penyesuaian produk
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div class="text-sm text-gray-700">
          Menampilkan {{ (pagination.page - 1) * pagination.limit + 1 }} sampai
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} dari
          {{ pagination.total }} hasil
        </div>
        <div class="flex space-x-2">
          <button
            @click="loadAdjustments(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="loadAdjustments(pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Adjustment Modal -->
    <div
      v-if="showAdjustmentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showAdjustmentModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Tambah Penyesuaian Produk</h3>
            <button
              @click="showAdjustmentModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveAdjustment" class="space-y-4">
            <!-- Product Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Produk *</label>
              <select
                v-model="adjustmentForm.productId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Pilih Produk</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }} (Stok: {{ product.stock }})
                </option>
              </select>
            </div>

            <!-- Adjustment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Penyesuaian *</label>
              <select
                v-model="adjustmentForm.type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="INCREASE">Penambahan Stok</option>
                <option value="DECREASE">Pengurangan Stok</option>
              </select>
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah *</label>
              <input
                v-model.number="adjustmentForm.quantity"
                type="number"
                required
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Alasan *</label>
              <textarea
                v-model="adjustmentForm.reason"
                required
                rows="3"
                placeholder="Contoh: Retur dari supplier, Barang rusak, Stok opname, dll"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">Jelaskan alasan penyesuaian stok secara detail</p>
            </div>

            <!-- Suggestion -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-xs font-medium text-blue-900 mb-1">💡 Saran Alasan:</p>
              <ul class="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Stok opname / Stocktaking</li>
                <li>Retur ke supplier</li>
                <li>Barang rusak / Expired</li>
                <li>Penyesuaian sistem</li>
                <li>Koreksi data</li>
                <li>Barang hilang / Theft</li>
                <li>Sample / Promosi</li>
              </ul>
            </div>

            <div class="flex space-x-3 pt-4">
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button
                type="button"
                @click="showAdjustmentModal = false"
                class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
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
import { formatDateTime } from '../../utils/formatters';
import { useNotification } from '../../composables/useNotification';

const { success: showSuccess, error: showError } = useNotification();

const loading = ref(false);
const saving = ref(false);
const adjustments = ref<any[]>([]);
const products = ref<any[]>([]);
const showAdjustmentModal = ref(false);

const filters = ref({
  search: '',
  type: '',
  startDate: '',
  endDate: '',
});

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

const adjustmentForm = ref({
  productId: '',
  type: 'INCREASE' as 'INCREASE' | 'DECREASE',
  quantity: 1,
  reason: '',
});

const loadAdjustments = async (page = 1) => {
  loading.value = true;
  try {
    const params: any = {
      page,
      limit: pagination.value.limit,
    };

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    const response = await api.get('/products/adjustments', { params });
    adjustments.value = response.data.data || [];
    pagination.value = response.data.pagination || pagination.value;
    pagination.value.page = page;
  } catch (error: any) {
    console.error('Error loading adjustments:', error);
    await showError(error.response?.data?.message || 'Gagal memuat data penyesuaian');
  } finally {
    loading.value = false;
  }
};

const loadProducts = async () => {
  try {
    const response = await api.get('/products', { params: { limit: 1000 } });
    products.value = response.data.data || [];
  } catch (error: any) {
    console.error('Error loading products:', error);
  }
};

const saveAdjustment = async () => {
  saving.value = true;
  try {
    await api.post('/products/adjustments', adjustmentForm.value);
    await showSuccess('Penyesuaian produk berhasil disimpan');
    showAdjustmentModal.value = false;
    adjustmentForm.value = {
      productId: '',
      type: 'INCREASE',
      quantity: 1,
      reason: '',
    };
    await loadAdjustments(pagination.value.page);
    await loadProducts();
  } catch (error: any) {
    console.error('Error saving adjustment:', error);
    await showError(error.response?.data?.message || 'Gagal menyimpan penyesuaian');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadAdjustments();
  loadProducts();
});
</script>

