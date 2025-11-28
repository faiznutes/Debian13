<template>
  <div class="flex flex-col h-full">
    <!-- Tenant Selector for Super Admin -->
    <TenantSelector @tenant-changed="handleTenantChange" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Pelanggan</h2>
        <p class="text-sm sm:text-base text-gray-600">Kelola data pelanggan</p>
      </div>
      <button
        v-if="canManageCustomers || authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'"
        @click="showCreateModal = true"
        class="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center space-x-2"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="hidden sm:inline">Tambah Pelanggan</span>
        <span class="sm:hidden">Tambah</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 mb-4 sm:mb-6 mx-4 sm:mx-6">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="filters.search"
          @focus="handleSearchFocus"
          @input="handleSearchInput"
          type="text"
          placeholder="Cari pelanggan..."
          class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        />
      </div>
    </div>

    <!-- Customers Grid -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-gray-500">Memuat...</div>
    </div>

    <div v-else-if="customers.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-gray-500">Belum ada pelanggan</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
      <div
        v-for="customer in customers"
        :key="customer.id"
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 sm:p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-600 font-semibold text-lg">
                {{ customer.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ customer.name }}</h3>
              <p v-if="customer.email" class="text-sm text-gray-500">{{ customer.email }}</p>
              <p v-if="customer.phone" class="text-sm text-gray-500">{{ customer.phone }}</p>
            </div>
          </div>
        </div>
        <div class="space-y-2 mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Total Pesanan:</span>
            <span class="font-semibold text-gray-900">{{ customer.totalOrders || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Total Belanja:</span>
            <span class="font-semibold text-primary-600">{{ formatCurrency(customer.totalSpent || 0) }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-2 pt-3 sm:pt-4 border-t border-gray-200">
          <button
            v-if="canManageCustomers || authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'"
            @click="editCustomer(customer)"
            class="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            Edit
          </button>
          <button
            @click="viewCustomer(customer)"
            class="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition"
          >
            Detail
          </button>
          <button
            v-if="canManageCustomers || authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'"
            @click="deleteCustomer(customer.id)"
            class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center space-x-2 mt-6">
      <button
        @click="loadCustomers(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Sebelumnya
      </button>
      <span class="px-4 py-2 text-gray-700">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <button
        @click="loadCustomers(pagination.page + 1)"
        :disabled="pagination.page === pagination.totalPages"
        class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Selanjutnya
      </button>
    </div>
  </div>

  <!-- Customer Modal -->
  <CustomerModal
    :show="showCreateModal"
    :customer="editingCustomer"
    @close="closeModal"
    @save="handleSaveCustomer"
  />

  <!-- Tenant Selector Modal -->
  <TenantSelectorModal
    :show="showTenantModal"
    @close="showTenantModal = false"
    @select="handleTenantSelected"
  />

  <!-- Customer Detail Modal -->
  <CustomerDetailModal
    :show="showDetailModal"
    :customer="viewingCustomer"
    @close="showDetailModal = false"
    @edit="handleEditFromDetail"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../stores/auth';
import TenantSelectorModal from '../../components/TenantSelectorModal.vue';
import TenantSelector from '../../components/TenantSelector.vue';
import CustomerModal from '../../components/CustomerModal.vue';
import CustomerDetailModal from '../../components/CustomerDetailModal.vue';
import { useTenantCheck } from '../../composables/useTenantCheck';
import { useNotification } from '../../composables/useNotification';
import { usePermissions } from '../../composables/usePermissions';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
}

const authStore = useAuthStore();
const { needsTenantSelection, showTenantModal, handleTenantSelected } = useTenantCheck();
const { success: showSuccess, error: showError, confirm: showConfirm } = useNotification();
const { canManageCustomers } = usePermissions();

const customers = ref<Customer[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showDetailModal = ref(false);
const editingCustomer = ref<Customer | null>(null);
const viewingCustomer = ref<Customer | null>(null);
const filters = ref({
  search: '',
});
const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
});

// Debounce to prevent rate limiting
let loadCustomersTimeout: ReturnType<typeof setTimeout> | null = null;

const loadCustomers = async (page = 1) => {
  // Check if tenant selection is needed (modal as fallback)
  if (needsTenantSelection.value) {
    if (page === 1) {
      showTenantModal.value = true;
    }
    return;
  }
  
  // Clear existing timeout
  if (loadCustomersTimeout) clearTimeout(loadCustomersTimeout);
  
  // Debounce API call
  loadCustomersTimeout = setTimeout(async () => {
    loading.value = true;
    try {
      const params: any = {
        page,
        limit: pagination.value.limit,
        ...(filters.value.search && { search: filters.value.search }),
      };
      const response = await api.get('/customers', { params });
      customers.value = response.data.data;
      pagination.value = response.data.pagination;
    } catch (error: any) {
      console.error('Error loading customers:', error);
      if (error.response?.status !== 429) { // Don't show error for rate limiting
        await showError(error.response?.data?.message || 'Gagal memuat pelanggan');
      }
    } finally {
      loading.value = false;
    }
  }, page === 1 ? 100 : 0); // Only debounce on first load
};

const editCustomer = (customer: Customer) => {
  editingCustomer.value = customer;
  showCreateModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  editingCustomer.value = null;
};

const handleSaveCustomer = async (customerData: Partial<Customer>) => {
  try {
    if (editingCustomer.value) {
      // Update existing customer
      await api.put(`/customers/${editingCustomer.value.id}`, customerData);
      await showSuccess('Pelanggan berhasil diupdate');
    } else {
      // Create new customer
      await api.post('/customers', customerData);
      await showSuccess('Pelanggan berhasil ditambahkan');
    }
    closeModal();
    await loadCustomers(pagination.value.page);
  } catch (error: any) {
    console.error('Error saving customer:', error);
    await showError(error.response?.data?.message || 'Gagal menyimpan pelanggan');
  }
};

const viewCustomer = (customer: Customer) => {
  viewingCustomer.value = customer;
  showDetailModal.value = true;
};

const handleEditFromDetail = (customer: Customer) => {
  showDetailModal.value = false;
  editingCustomer.value = customer;
  showCreateModal.value = true;
};

const deleteCustomer = async (id: string) => {
  const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus pelanggan ini?');
  if (!confirmed) return;
  try {
    await api.delete(`/customers/${id}`);
    await loadCustomers(pagination.value.page);
    await showSuccess('Pelanggan berhasil dihapus');
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus pelanggan');
  }
};

watch(() => filters.value.search, () => {
  loadCustomers(1);
});

const handleTenantChange = (tenantId: string | null) => {
  // Reload customers when tenant changes
  if (tenantId && !needsTenantSelection.value) {
    loadCustomers();
  }
};

watch(() => authStore.selectedTenantId, () => {
  if (authStore.selectedTenantId && !needsTenantSelection.value) {
    loadCustomers();
  }
});

const handleSearchFocus = () => {
  // No-op, just for compatibility
};

const handleSearchInput = () => {
  loadCustomers(1);
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!needsTenantSelection.value) {
    loadCustomers();
  }
});
</script>

