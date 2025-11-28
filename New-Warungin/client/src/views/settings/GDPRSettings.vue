<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">GDPR Compliance</h1>
      <p class="text-gray-600">Kelola data pribadi Anda sesuai dengan GDPR</p>
    </div>

    <div class="space-y-6">
      <!-- Data Export -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Ekspor Data (Right to Data Portability)</h2>
        <p class="text-gray-600 mb-4">
          Unduh semua data pribadi Anda dalam format JSON. Data ini termasuk semua informasi yang terkait dengan akun Anda.
        </p>
        <button
          @click="exportData"
          :disabled="exporting"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
        >
          {{ exporting ? 'Mengekspor...' : 'Ekspor Data Saya' }}
        </button>
      </div>

      <!-- Data Deletion -->
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Hapus Data (Right to be Forgotten)</h2>
        <p class="text-gray-600 mb-4">
          <strong class="text-red-600">Peringatan:</strong> Tindakan ini akan menghapus semua data pribadi Anda dan menonaktifkan akun Anda. Tindakan ini tidak dapat dibatalkan.
        </p>
        
        <div v-if="!showDeleteConfirm" class="space-y-4">
          <button
            @click="showDeleteConfirm = true"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Hapus Data Saya
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800 mb-2">
              <strong>Konfirmasi Penghapusan:</strong>
            </p>
            <p class="text-sm text-red-700 mb-4">
              Ketik <strong>"DELETE_MY_DATA"</strong> di bawah ini untuk mengonfirmasi penghapusan data Anda.
            </p>
            <input
              v-model="deleteConfirmText"
              type="text"
              placeholder="Ketik DELETE_MY_DATA"
              class="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div class="flex space-x-2">
            <button
              @click="deleteData"
              :disabled="deleteConfirmText !== 'DELETE_MY_DATA' || deleting"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
            >
              {{ deleting ? 'Menghapus...' : 'Konfirmasi Hapus Data' }}
            </button>
            <button
              @click="showDeleteConfirm = false; deleteConfirmText = ''"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      <!-- Tenant Data Export (Admin Only) -->
      <div v-if="authStore.user?.role === 'ADMIN_TENANT' || authStore.user?.role === 'SUPER_ADMIN'" class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Ekspor Data Tenant</h2>
        <p class="text-gray-600 mb-4">
          Sebagai admin tenant, Anda dapat mengekspor semua data tenant termasuk produk, pesanan, transaksi, dan pelanggan.
        </p>
        <button
          @click="exportTenantData"
          :disabled="exportingTenant"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
        >
          {{ exportingTenant ? 'Mengekspor...' : 'Ekspor Data Tenant' }}
        </button>
      </div>

      <!-- Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-3">Tentang GDPR</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Right to Data Portability:</strong> Anda berhak untuk mendapatkan salinan data pribadi Anda dalam format yang terstruktur dan dapat dibaca mesin.</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Right to be Forgotten:</strong> Anda berhak untuk meminta penghapusan data pribadi Anda, dengan beberapa pengecualian untuk kepentingan hukum atau bisnis yang sah.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '../../api';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

const exporting = ref(false);
const exportingTenant = ref(false);
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref('');

const exportData = async () => {
  exporting.value = true;
  try {
    const response = await api.get('/gdpr/export', {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `warungin-data-export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    alert('Data berhasil diekspor');
  } catch (error: any) {
    console.error('Error exporting data:', error);
    alert(error.response?.data?.message || 'Gagal mengekspor data');
  } finally {
    exporting.value = false;
  }
};

const exportTenantData = async () => {
  exportingTenant.value = true;
  try {
    const response = await api.get('/gdpr/export-tenant', {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `warungin-tenant-export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    alert('Data tenant berhasil diekspor');
  } catch (error: any) {
    console.error('Error exporting tenant data:', error);
    alert(error.response?.data?.message || 'Gagal mengekspor data tenant');
  } finally {
    exportingTenant.value = false;
  }
};

const deleteData = async () => {
  if (deleteConfirmText.value !== 'DELETE_MY_DATA') {
    return;
  }

  if (!confirm('Apakah Anda yakin ingin menghapus semua data pribadi Anda? Tindakan ini tidak dapat dibatalkan dan akun Anda akan dinonaktifkan.')) {
    return;
  }

  deleting.value = true;
  try {
    await api.post('/gdpr/delete', {
      confirm: 'DELETE_MY_DATA',
    });

    alert('Data Anda telah dihapus. Anda akan diarahkan ke halaman login.');
    
    // Clear auth and redirect to login
    authStore.clearAuth();
    window.location.href = '/login';
  } catch (error: any) {
    console.error('Error deleting data:', error);
    alert(error.response?.data?.message || 'Gagal menghapus data');
  } finally {
    deleting.value = false;
  }
};
</script>

