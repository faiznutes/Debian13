<template>
  <div class="flex flex-col h-full">
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Produk Tenant</h3>
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
              placeholder="Cari produk..."
              class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <p class="text-gray-500">Belum ada produk</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
      >
        <div class="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center overflow-hidden">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="w-full h-48 object-cover"
          />
          <span v-else-if="product.emoji" class="text-6xl sm:text-7xl">{{ product.emoji }}</span>
          <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div class="p-4">
          <h4 class="font-semibold text-gray-900 mb-1">{{ product.name }}</h4>
          <p class="text-sm text-gray-600 mb-2">{{ product.category }}</p>
          <p class="text-lg font-bold text-primary-600 mb-2">{{ formatCurrency(product.price) }}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Stok: {{ product.stock }}</span>
            <span
              class="px-2 py-1 text-xs rounded-full"
              :class="product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ product.isActive ? 'Aktif' : 'Tidak Aktif' }}
            </span>
          </div>
          <div class="mt-3 flex gap-2">
            <button
              @click="editProduct(product)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            >
              Edit
            </button>
            <button
              @click="deleteProduct(product.id)"
              class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Modal -->
    <ProductModal
      v-if="showCreateModal || editingProduct"
      :show="showCreateModal || !!editingProduct"
      :product="editingProduct"
      @close="closeModal"
      @save="handleSaveProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../../api';
import { formatCurrency } from '../../../utils/formatters';
import { useNotification } from '../../../composables/useNotification';
import ProductModal from '../../../components/ProductModal.vue';

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();

const { success, error, confirm: confirmDialog } = useNotification();
const products = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const editingProduct = ref<any>(null);
const filters = ref({
  search: '',
});

const filteredProducts = computed(() => {
  let result = products.value;
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }
  return result;
});

const loadProducts = async () => {
  if (!props.tenantId) return;
  
  loading.value = true;
  try {
    // tenantId will be added automatically by API interceptor for SUPER_ADMIN
    // Use maximum allowed limit (100) and load all pages if needed
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await api.get('/products', {
        params: { 
          page,
          limit: 100, // Maximum allowed by validator
        },
      });
      
      const pageData = response.data.data || response.data;
      if (Array.isArray(pageData)) {
        allProducts = [...allProducts, ...pageData];
      } else if (Array.isArray(response.data)) {
        allProducts = [...allProducts, ...response.data];
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
    
    products.value = allProducts;
  } catch (err: any) {
    console.error('Error loading products:', err);
    error('Gagal memuat produk', 'Terjadi Kesalahan');
  } finally {
    loading.value = false;
  }
};

const editProduct = (product: any) => {
  editingProduct.value = product;
};

const deleteProduct = async (id: string) => {
  const confirmed = await confirmDialog(
    'Apakah Anda yakin ingin menghapus produk ini?',
    'Konfirmasi Hapus Produk',
    'Ya, Hapus',
    'Batal'
  );
  
  if (!confirmed) return;
  
  try {
    await api.delete(`/products/${id}`);
    await loadProducts();
    success('Produk berhasil dihapus', 'Berhasil');
  } catch (err: any) {
    console.error('Error deleting product:', err);
    error(err.response?.data?.message || 'Gagal menghapus produk', 'Terjadi Kesalahan');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingProduct.value = null;
};

const handleSaveProduct = async (productData: any) => {
  try {
    if (editingProduct.value) {
      await api.put(`/products/${editingProduct.value.id}`, productData);
      success('Produk berhasil diupdate', 'Berhasil');
    } else {
      await api.post('/products', productData);
      success('Produk berhasil ditambahkan', 'Berhasil');
    }
    await loadProducts();
    closeModal();
  } catch (err: any) {
    console.error('Error saving product:', err);
    error(err.response?.data?.message || 'Gagal menyimpan produk', 'Terjadi Kesalahan');
  }
};

watch(() => props.tenantId, (newTenantId, oldTenantId) => {
  // Only reload if tenantId actually changed
  if (newTenantId && newTenantId !== oldTenantId) {
    // Ensure tenantId is set in localStorage for API interceptor
    localStorage.setItem('selectedTenantId', newTenantId);
    // Small delay to ensure localStorage is updated
    setTimeout(() => {
      loadProducts();
    }, 100);
  }
}, { immediate: true });
</script>

