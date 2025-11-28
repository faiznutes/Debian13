<template>
  <div class="flex flex-col h-full">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">System Settings</h2>
      <p class="text-gray-600">Konfigurasi sistem dan pengaturan global</p>
    </div>

    <div class="space-y-6">
      <!-- General Settings -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Pengaturan Umum</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Sistem</label>
            <input
              v-model="settings.systemName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Support</label>
            <input
              v-model="settings.supportEmail"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              v-model="settings.timezone"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Subscription Receipt Template Management -->
      <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Template Struk Langganan</h3>
            <p class="text-sm text-gray-600">Kelola template struk untuk langganan tenant</p>
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
          <p>• Template ini digunakan untuk struk langganan tenant</p>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Pengaturan Keamanan</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-gray-700">Require Strong Password</label>
              <p class="text-xs text-gray-500">Wajibkan password yang kuat untuk semua user</p>
            </div>
            <input
              v-model="settings.requireStrongPassword"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
              <p class="text-xs text-gray-500">Aktifkan 2FA untuk Super Admin</p>
            </div>
            <input
              v-model="settings.enable2FA"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
        
        <!-- Quick Links -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <router-link
              to="/app/settings/2fa"
              class="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p class="font-semibold text-gray-900">Two-Factor Authentication</p>
                <p class="text-sm text-gray-600">Kelola 2FA untuk akun Anda</p>
              </div>
            </router-link>
            
            <router-link
              to="/app/settings/webhooks"
              class="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div>
                <p class="font-semibold text-gray-900">Webhooks</p>
                <p class="text-sm text-gray-600">Kelola webhook untuk integrasi</p>
              </div>
            </router-link>

            <router-link
              to="/app/settings/sessions"
              class="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="font-semibold text-gray-900">Active Sessions</p>
                <p class="text-sm text-gray-600">Kelola sesi aktif Anda</p>
              </div>
            </router-link>

            <router-link
              to="/app/settings/password"
              class="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <div>
                <p class="font-semibold text-gray-900">Password Settings</p>
                <p class="text-sm text-gray-600">Ubah password Anda</p>
              </div>
            </router-link>

            <router-link
              to="/app/settings/gdpr"
              class="flex items-center space-x-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
            >
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p class="font-semibold text-gray-900">GDPR Compliance</p>
                <p class="text-sm text-gray-600">Ekspor atau hapus data Anda</p>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- Subscription Receipt Template Manager -->
    <SubscriptionReceiptTemplateManager
      :show="showTemplateManager"
      @close="showTemplateManager = false"
      @updated="() => {}"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useNotification } from '../../composables/useNotification';
import SubscriptionReceiptTemplateManager from '../../components/SubscriptionReceiptTemplateManager.vue';

const { success: showSuccess, error: showError } = useNotification();

const settings = ref({
  systemName: 'Warungin',
  supportEmail: 'support@warungin.com',
  timezone: 'Asia/Jakarta',
  requireStrongPassword: true,
  enable2FA: false,
});

const showTemplateManager = ref(false);

const loadSettings = async () => {
  try {
    const response = await api.get('/settings/system');
    settings.value = { ...settings.value, ...response.data };
  } catch (error: any) {
    console.error('Error loading settings:', error);
  }
};

const saveSettings = async () => {
  try {
    await api.put('/settings/system', settings.value);
    await showSuccess('Pengaturan berhasil disimpan');
  } catch (error: any) {
    await showError('Gagal menyimpan pengaturan');
  }
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadSettings();
});
</script>

