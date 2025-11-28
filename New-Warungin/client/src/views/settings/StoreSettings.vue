<template>
  <div class="flex flex-col h-full">

    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Pengaturan Toko</h2>
      <p class="text-gray-600">Kelola informasi dan pengaturan toko Anda</p>
    </div>

    <div class="space-y-6">
      <!-- Store Information -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Informasi Toko</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Toko</label>
            <input
              v-model="storeInfo.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea
              v-model="storeInfo.address"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
            <input
              v-model="storeInfo.phone"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              v-model="storeInfo.email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <!-- Receipt Template Management -->
      <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Template Struk</h3>
            <p class="text-sm text-gray-600">Kelola template struk untuk berbagai ukuran kertas</p>
          </div>
          <button
            @click="showTemplateManager = true"
            class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center space-x-2"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Kelola Template</span>
          </button>
        </div>
        <div class="text-sm text-gray-600">
          <p>• Pilih template untuk A4, Thermal 58mm, atau Thermal 80mm</p>
          <p>• Sesuaikan header, footer, dan field yang ditampilkan</p>
          <p>• Support print via Browser, Thermal, dan Bluetooth</p>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- Receipt Template Manager -->
    <ReceiptTemplateManager
      :show="showTemplateManager"
      @close="showTemplateManager = false"
      @updated="loadSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useAuthStore } from '../../stores/auth';
import ReceiptTemplateManager from '../../components/ReceiptTemplateManager.vue';
import { useNotification } from '../../composables/useNotification';

const authStore = useAuthStore();
const { success: showSuccess, error: showError } = useNotification();

const storeInfo = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
});

const receiptSettings = ref({
  header: '',
  footer: '',
});
const showTemplateManager = ref(false);

const loadSettings = async () => {
  if (!authStore.isAuthenticated) return;
  
  try {
    const response = await api.get('/tenant/profile');
    storeInfo.value = {
      name: response.data.name || '',
      address: response.data.address || '',
      phone: response.data.phone || '',
      email: response.data.email || '',
    };
    receiptSettings.value = {
      header: response.data.receiptHeader || '',
      footer: response.data.receiptFooter || '',
    };
  } catch (error: any) {
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    console.error('Error loading settings:', error);
    if (authStore.isAuthenticated && error.response?.status !== 404) {
      await showError('Gagal memuat pengaturan toko');
    }
  }
};

const saveSettings = async () => {
  if (!authStore.isAuthenticated) return;
  
  try {
    await api.put('/tenant/profile', {
      ...storeInfo.value,
      receiptHeader: receiptSettings.value.header,
      receiptFooter: receiptSettings.value.footer,
    });
    await showSuccess('Pengaturan berhasil disimpan');
    // Reload settings to get updated data
    await loadSettings();
  } catch (error: any) {
    // Suppress errors during logout (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return;
    }
    console.error('Error saving settings:', error);
    const errorMessage = error.response?.data?.message || 'Gagal menyimpan pengaturan';
    await showError(errorMessage);
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadSettings();
});
</script>

