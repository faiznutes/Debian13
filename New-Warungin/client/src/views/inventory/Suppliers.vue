<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Suppliers</h2>
        <p class="text-gray-600">Kelola supplier untuk purchase order</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Supplier</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex items-center space-x-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search suppliers..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        @input="loadSuppliers"
      />
      <select
        v-model="isActiveFilter"
        @change="loadSuppliers"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="suppliers.length === 0" class="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-gray-500">Belum ada supplier</p>
    </div>

    <!-- Suppliers Table -->
    <div v-else class="bg-white rounded-lg shadow-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="supplier in suppliers" :key="supplier.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ supplier.name }}</div>
              <div v-if="supplier.contactPerson" class="text-xs text-gray-500">{{ supplier.contactPerson }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="supplier.email" class="text-sm text-gray-900">{{ supplier.email }}</div>
              <div v-if="supplier.phone" class="text-sm text-gray-500">{{ supplier.phone }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">{{ supplier.address || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ supplier.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="editSupplier(supplier)"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                Edit
              </button>
              <button
                @click="deleteSupplier(supplier)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} results
        </div>
        <div class="flex space-x-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingSupplier"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ editingSupplier ? 'Edit Supplier' : 'Tambah Supplier' }}
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveSupplier" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                v-model="supplierForm.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  v-model="supplierForm.email"
                  type="email"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  v-model="supplierForm.phone"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                v-model="supplierForm.contactPerson"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                v-model="supplierForm.address"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="supplierForm.notes"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>

            <div v-if="editingSupplier" class="flex items-center">
              <input
                v-model="supplierForm.isActive"
                type="checkbox"
                id="isActive"
                class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label for="isActive" class="ml-2 text-sm text-gray-700">Active</label>
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
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : editingSupplier ? 'Update' : 'Simpan' }}
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

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
}

const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const isActiveFilter = ref('');
const showCreateModal = ref(false);
const editingSupplier = ref<Supplier | null>(null);
const saving = ref(false);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const supplierForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  notes: '',
  isActive: true,
});

const loadSuppliers = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    if (isActiveFilter.value) {
      params.isActive = isActiveFilter.value === 'true';
    }
    const response = await api.get('/suppliers', { params });
    suppliers.value = response.data.data;
    pagination.value = response.data.pagination;
  } catch (error: any) {
    console.error('Error loading suppliers:', error);
    await showError('Gagal memuat suppliers');
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  pagination.value.page = page;
  loadSuppliers();
};

const saveSupplier = async () => {
  saving.value = true;
  try {
    if (editingSupplier.value) {
      await api.put(`/suppliers/${editingSupplier.value.id}`, supplierForm.value);
      await showSuccess('Supplier berhasil diupdate');
    } else {
      await api.post('/suppliers', supplierForm.value);
      await showSuccess('Supplier berhasil dibuat');
    }
    closeModal();
    await loadSuppliers();
  } catch (error: any) {
    console.error('Error saving supplier:', error);
    await showError('Gagal menyimpan supplier');
  } finally {
    saving.value = false;
  }
};

const editSupplier = (supplier: Supplier) => {
  editingSupplier.value = supplier;
  supplierForm.value = {
    name: supplier.name,
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    contactPerson: supplier.contactPerson || '',
    notes: supplier.notes || '',
    isActive: supplier.isActive,
  };
  showCreateModal.value = true;
};

const deleteSupplier = async (supplier: Supplier) => {
  const confirmed = await showConfirm(
    'Hapus Supplier',
    `Apakah Anda yakin ingin menghapus supplier "${supplier.name}"?`
  );
  if (!confirmed) return;

  try {
    await api.delete(`/suppliers/${supplier.id}`);
    await showSuccess('Supplier berhasil dihapus');
    await loadSuppliers();
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    await showError(error.response?.data?.message || 'Gagal menghapus supplier');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingSupplier.value = null;
  supplierForm.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    notes: '',
    isActive: true,
  };
};

onMounted(() => {
  loadSuppliers();
});
</script>

