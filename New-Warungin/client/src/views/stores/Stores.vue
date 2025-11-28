<template>
  <div class="flex flex-col h-full">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6 px-4 sm:px-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Kelola Store</h2>
        <p class="text-sm sm:text-base text-gray-600">Kelola store/outlet untuk bisnis Anda</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Store</span>
      </button>
    </div>

    <!-- Stores List -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-gray-600 font-medium">Memuat data store...</div>
      </div>
    </div>

    <div v-else-if="stores.length === 0" class="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300 mx-4 sm:mx-6">
      <svg class="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Belum Ada Store</h3>
      <p class="text-gray-600 text-center max-w-md mb-4">Mulai dengan menambahkan store pertama Anda</p>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
      >
        Tambah Store Pertama
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6">
      <div
        v-for="store in stores"
        :key="store.id"
        class="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-1">{{ store.name }}</h3>
            <div class="flex items-center gap-2 mb-2">
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ store.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="editStore(store)"
              class="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
              title="Edit Store"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="deleteStore(store)"
              class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Hapus Store"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="space-y-2 text-sm text-gray-600">
          <div v-if="store.address" class="flex items-start gap-2">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="flex-1">{{ store.address }}</span>
          </div>
          <div v-if="store.phone" class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{{ store.phone }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingStore"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">
              {{ editingStore ? 'Edit Store' : 'Tambah Store Baru' }}
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

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nama Store <span class="text-red-500">*</span>
              </label>
              <input
                v-model="storeForm.name"
                type="text"
                required
                placeholder="Contoh: Store Cabang A"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                v-model="storeForm.address"
                rows="3"
                placeholder="Alamat lengkap store"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                v-model="storeForm.phone"
                type="tel"
                placeholder="081234567890"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div v-if="editingStore" class="flex items-center gap-2">
              <input
                v-model="storeForm.isActive"
                type="checkbox"
                id="isActive"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label for="isActive" class="text-sm font-medium text-gray-700">
                Store Aktif
              </label>
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
                :disabled="processing"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ processing ? 'Menyimpan...' : editingStore ? 'Update' : 'Simpan' }}
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

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const stores = ref<Store[]>([]);
const loading = ref(false);
const processing = ref(false);
const showCreateModal = ref(false);
const editingStore = ref<Store | null>(null);

const storeForm = ref({
  name: '',
  address: '',
  phone: '',
  isActive: true,
});

const loadStores = async () => {
  loading.value = true;
  try {
    const response = await api.get('/outlets');
    stores.value = response.data.data || [];
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal memuat data store');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  processing.value = true;
  try {
    if (editingStore.value) {
      await api.put(`/outlets/${editingStore.value.id}`, storeForm.value);
      await showSuccess('Store berhasil diupdate');
    } else {
      await api.post('/outlets', storeForm.value);
      await showSuccess('Store berhasil ditambahkan');
    }
    closeModal();
    await loadStores();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menyimpan store');
  } finally {
    processing.value = false;
  }
};

const editStore = (store: Store) => {
  editingStore.value = store;
  storeForm.value = {
    name: store.name,
    address: store.address || '',
    phone: store.phone || '',
    isActive: store.isActive,
  };
  showCreateModal.value = true;
};

const deleteStore = async (store: Store) => {
  const confirmed = await showConfirm(
    `Hapus store "${store.name}"?`,
    'Tindakan ini tidak dapat dibatalkan. Store akan dinonaktifkan jika memiliki pesanan.'
  );
  
  if (!confirmed) return;

  try {
    await api.delete(`/outlets/${store.id}`);
    await showSuccess('Store berhasil dihapus');
    await loadStores();
  } catch (error: any) {
    await showError(error.response?.data?.message || 'Gagal menghapus store');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingStore.value = null;
  storeForm.value = {
    name: '',
    address: '',
    phone: '',
    isActive: true,
  };
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadStores();
});
</script>

